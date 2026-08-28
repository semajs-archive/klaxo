/**
 * SourceAnalysisService — turn raw source material into a KnowledgePackage.
 *
 * This service coordinates extraction (image/PDF/text) into structured
 * source analysis via the AI provider, then persists fragments and the
 * knowledge package with full provenance.
 */
import { randomUUID } from 'node:crypto';
import { getAiContext } from '../ai';
import { generateStructured, resolveModel } from '../ai/router';
import { SourceAnalysis, SourceAnalysisSchema } from '../ai/types';
import { delimitSource, SOURCE_EXTRACTION_SYSTEM } from '../pipeline/prompts';
import {
  getSourceDocument,
  createSourceFragment,
  createKnowledgePackage,
  updateSourceDocument,
  listSourceDocuments,
} from '../db/repo';
import { logger } from '../lib/logger';
import { aiUnavailable, pipelineFailed } from '../lib/errors';
import { extractPdfText } from './pdf';
import { readFileSync } from 'node:fs';

export interface AnalyzeSourceInput {
  courseId: string;
  documentId: string;
}

export interface SourceAnalysisResult {
  knowledgePackageId: string;
  analysis: SourceAnalysis;
  fragmentCount: number;
  model: string;
  provider: string;
}

/**
 * Analyze a source document into a structured KnowledgePackage.
 *
 * - For images: send base64 through the vision model.
 * - For PDFs: extract text locally, then send text to the text model.
 * - For text/prompt: send text directly.
 */
export async function analyzeSource(input: AnalyzeSourceInput): Promise<SourceAnalysisResult> {
  const { provider, routing } = getAiContext();
  const doc = getSourceDocument(input.documentId);
  if (!doc) throw pipelineFailed(`Source document ${input.documentId} not found`);

  // Gather raw text (extract PDF text if needed).
  let rawText = doc.extractedText ?? '';
  let images: string[] = [];

  if (doc.kind === 'pdf') {
    if (doc.storagePath) {
      try {
        const buffer = readFileSync(doc.storagePath);
        const extracted = await extractPdfText(buffer);
        rawText = extracted.fullText;
      } catch (err) {
        logger.warn('PDF extraction failed; falling back to stored text', {
          error: (err as Error).message,
        });
      }
    }
  } else if (doc.kind === 'image') {
    if (doc.storagePath) {
      try {
        const buffer = readFileSync(doc.storagePath);
        images = [buffer.toString('base64')];
      } catch (err) {
        throw pipelineFailed(`Failed to read image: ${(err as Error).message}`);
      }
    }
  }

  if (!rawText.trim() && images.length === 0) {
    throw aiUnavailable('Source document has no extractable content.');
  }

  // Determine the model (vision for images, otherwise text).
  const model = resolveModel(routing, 'source_extraction');

  // Build messages with the source delimited.
  const messages = [
    { role: 'system' as const, content: SOURCE_EXTRACTION_SYSTEM },
    {
      role: 'user' as const,
      content: delimitSource(rawText || '[Image provided]'),
      images: images.length > 0 ? images : undefined,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: SourceAnalysisSchema },
    { maxRetries: 2, temperature: 0.2 },
  );

  const analysis = result.value;

  // Persist fragments extracted from the source (reconstruct from analysis).
  const fragments = reconstructFragments(analysis, rawText);
  let ordinal = 0;
  const persistedFragments: string[] = [];
  for (const frag of fragments) {
    const f = createSourceFragment({
      id: `frag_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId: input.courseId,
      documentId: input.documentId,
      ordinal: ordinal++,
      kind: frag.kind,
      text: frag.text,
      page: frag.page,
      confidence: frag.confidence,
      uncertain: frag.uncertain ? 1 : 0,
    });
    persistedFragments.push(f.id);
  }

  // Persist the knowledge package.
  const kp = createKnowledgePackage({
    id: `kp_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    courseId: input.courseId,
    detectedTitle: analysis.title,
    detectedSubject: analysis.subject,
    detectedLevel: analysis.level,
    summary: analysis.summary,
    payload: JSON.stringify(analysis),
    confidence: analysis.confidence,
    status: 'draft',
    origin: 'AI_GENERATED',
  });

  // Mark the source doc as extracted.
  updateSourceDocument(input.documentId, {
    status: 'extracted',
    extractionModel: model,
    extractionProvider: provider.id,
    confidence: analysis.confidence,
  });

  return {
    knowledgePackageId: kp.id,
    analysis,
    fragmentCount: persistedFragments.length,
    model,
    provider: provider.id,
  };
}

/**
 * Reconstruct fragments from the source analysis (approximate provenance).
 * In a fuller implementation, fragments would be stored during raw extraction;
 * here we derive them from the structured objectives/units/terminology.
 */
function reconstructFragments(
  analysis: SourceAnalysis,
  rawText: string,
): Array<{ kind: string; text: string; page?: number; confidence?: number; uncertain?: boolean }> {
  const frags: Array<{ kind: string; text: string; page?: number; confidence?: number; uncertain?: boolean }> = [];

  // Unit titles.
  for (const unit of analysis.units) {
    frags.push({ kind: 'heading', text: unit.title, confidence: analysis.confidence });
  }

  // Objectives.
  for (const obj of analysis.objectives) {
    frags.push({
      kind: 'objective',
      text: obj.statement,
      confidence: analysis.confidence,
      uncertain: false,
    });
  }

  // Terminology.
  for (const term of analysis.terminology) {
    frags.push({ kind: 'other', text: term.term, confidence: analysis.confidence });
  }

  // Requirements.
  for (const req of analysis.requirements) {
    frags.push({ kind: 'requirement', text: req, confidence: analysis.confidence });
  }

  // Ambiguities (uncertain fragments).
  for (const amb of analysis.ambiguities) {
    frags.push({
      kind: 'other',
      text: amb.description,
      confidence: amb.confidence,
      uncertain: true,
    });
  }

  // If no structured fragments, fall back to raw text as a single fragment.
  if (frags.length === 0 && rawText.trim()) {
    frags.push({ kind: 'paragraph', text: rawText.slice(0, 5000), confidence: analysis.confidence });
  }

  return frags;
}

/**
 * Get all source documents for a course (for the source review screen).
 */
export function getCourseSources(courseId: string) {
  return listSourceDocuments(courseId);
}