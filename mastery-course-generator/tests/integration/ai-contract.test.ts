import { describe, it, expect } from 'vitest';

process.env.AI_DEV_MODE = 'true';

import { MockProvider } from '@/ai/mock-provider';
import {
  SourceAnalysisSchema,
  CurriculumBlueprintSchema,
  LessonContentSchema,
  PracticeSetSchema,
  AssessmentSchema,
  QaResultSchema,
} from '@/ai/types';
import {
  SOURCE_EXTRACTION_SYSTEM,
  BLUEPRINT_SYSTEM,
  LESSON_SYSTEM,
  PRACTICE_SYSTEM,
  ASSESSMENT_SYSTEM,
  QA_SYSTEM,
} from '@/pipeline/prompts';

const provider = new MockProvider();

async function completeFor(systemPrompt: string, userContent: string): Promise<unknown> {
  const res = await provider.complete({
    model: provider.getDefaultModel('planning'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });
  return JSON.parse(res.content);
}

describe('AI contract — mock provider output validates against Zod schemas', () => {
  it('validates source extraction output', async () => {
    const out = await completeFor(SOURCE_EXTRACTION_SYSTEM, 'Some source text');
    expect(() => SourceAnalysisSchema.parse(out)).not.toThrow();
  });

  it('validates blueprint output', async () => {
    const out = await completeFor(BLUEPRINT_SYSTEM, 'Build a blueprint');
    expect(() => CurriculumBlueprintSchema.parse(out)).not.toThrow();
  });

  it('validates lesson output', async () => {
    const out = await completeFor(LESSON_SYSTEM, 'Generate a lesson');
    expect(() => LessonContentSchema.parse(out)).not.toThrow();
  });

  it('validates practice output', async () => {
    const out = await completeFor(PRACTICE_SYSTEM, 'Generate practice');
    expect(() => PracticeSetSchema.parse(out)).not.toThrow();
  });

  it('validates assessment output', async () => {
    const out = await completeFor(ASSESSMENT_SYSTEM, 'Generate an assessment');
    expect(() => AssessmentSchema.parse(out)).not.toThrow();
  });

  it('validates QA output', async () => {
    const out = await completeFor(QA_SYSTEM, 'Review this curriculum');
    expect(() => QaResultSchema.parse(out)).not.toThrow();
  });
});