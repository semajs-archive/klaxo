/**
 * Durable job worker.
 *
 * Polls the `generation_jobs` table for QUEUED jobs and executes them against
 * the same DB/file storage the web server uses. This means a generation job does
 * NOT depend on an HTTP request staying alive — start a job from a route, and
 * this worker picks it up (or the route's in-process fallback does during dev).
 *
 * Local development:   npm run worker
 * Production:          run this as a separate long-lived process / container
 *                      alongside the web tier, sharing DATABASE_FILE + UPLOAD_DIR
 *                      (or, better, a managed Postgres + object storage).
 *
 * Also performs startup recovery: any job left in QUEUED/ANALYZING/PLANNING/
 * GENERATING/VALIDATING/REVISING for longer than the abandonment window is
 * marked FAILED so it can be retried rather than staying stuck forever.
 */
import { getDb } from '../src/db';
import { listQueuedJobs } from '../src/db/repo';
import { runJob, recoverAbandonedJobs } from '../src/pipeline/orchestrator';
import { logger } from '../src/lib/logger';

const POLL_MS = 1500;

async function tick(): Promise<void> {
  await recoverAbandonedJobs();

  const queued = listQueuedJobs(10);
  for (const job of queued) {
    try {
      await runJob(job.id);
    } catch (err) {
      // runJob already records failures on the job; log locally for the operator.
      logger.error('Worker job failed', { jobId: job.id, error: (err as Error).message });
    }
  }
}

async function main(): Promise<void> {
  // Initialise the DB (applies schema) before polling.
  getDb();
  logger.info('Worker started: polling for QUEUED generation jobs.');

  for (;;) {
    try {
      await tick();
    } catch (err) {
      logger.error('Worker tick failed', { error: (err as Error).message });
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

void main();