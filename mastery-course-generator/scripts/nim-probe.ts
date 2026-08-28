/**
 * Probe the configured FCC/NVIDIA NIM endpoint and report available models.
 *
 * Usage: `npm run nim:probe` (requires FCC_SERVER_API_KEY + FCC_SERVER_BASE_URL).
 * This is a diagnostics utility, not part of the application runtime.
 */
import { getAiContext } from '../src/ai';

async function main() {
  const { provider, realAiEnabled, devMode } = getAiContext();
  console.log(`AI mode: ${devMode ? 'mock (development fixtures)' : 'real NIM'}`);
  console.log(`Real AI enabled: ${realAiEnabled}`);

  try {
    const meta = await provider.getMetadata();
    console.log(`Provider: ${meta.name}`);
    console.log(`Models:`);
    for (const m of meta.models) {
      console.log(`  - ${m.id} (${m.type})`);
    }
  } catch (err) {
    console.error(`Failed to fetch provider metadata: ${(err as Error).message}`);
    process.exit(1);
  }

  const healthy = await provider.healthCheck();
  console.log(`Health check: ${healthy ? 'OK' : 'FAILED'}`);
  process.exit(healthy ? 0 : 1);
}

main();