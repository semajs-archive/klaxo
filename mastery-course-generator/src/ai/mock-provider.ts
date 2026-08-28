/**
 * Mock AI Provider (Development Mode Only)
 *
 * Deterministic, clearly-labelled fixtures for frontend/backend development
 * without external AI access. Each response is tagged provider="mock" so it can
 * never be mistaken for real NIM output.
 */
import {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderMetadata,
  StreamChunk,
} from './provider';

/**
 * Mock provider that returns canned responses based on the request content.
 * Used when AI_DEV_MODE=true.
 */
export class MockProvider implements AIProvider {
  readonly id = 'mock';
  readonly name = 'Development Fixtures (Mock)';
  private readonly models: Record<
    'planning' | 'generation' | 'assessment' | 'qa' | 'vision' | 'embedding',
    string
  >;

  constructor() {
    this.models = {
      planning: 'mock/planner',
      generation: 'mock/generator',
      assessment: 'mock/assessor',
      qa: 'mock/qa',
      vision: 'mock/vision',
      embedding: 'mock/embedder',
    };
  }

  async getMetadata(): Promise<ProviderMetadata> {
    return {
      name: this.name,
      version: '1.0.0',
      models: [
        { id: this.models.planning, type: 'chat', supportsJsonSchema: true, supportsStreaming: true },
        { id: this.models.generation, type: 'chat', supportsJsonSchema: true, supportsStreaming: true },
        { id: this.models.assessment, type: 'chat', supportsJsonSchema: true, supportsStreaming: true },
        { id: this.models.qa, type: 'chat', supportsJsonSchema: true, supportsStreaming: true },
        { id: this.models.vision, type: 'vision', supportsJsonSchema: true, supportsStreaming: true },
        { id: this.models.embedding, type: 'embedding' },
      ],
    };
  }

  getDefaultModel(
    task: 'planning' | 'generation' | 'assessment' | 'qa' | 'vision' | 'embedding',
  ): string {
    return this.models[task];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const content = this.mockContent(request);
    return {
      content,
      model: request.model,
      provider: this.id,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 1,
      finishReason: 'stop',
    };
  }

  async *streamComplete(request: CompletionRequest): AsyncIterable<StreamChunk> {
    const content = this.mockContent(request);
    // Stream word-by-word with tiny delays to simulate streaming.
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 1));
      yield {
        delta: i === 0 ? words[i] ?? '' : ` ${words[i] ?? ''}`,
        done: false,
        model: request.model,
        provider: this.id,
      };
    }
    yield { delta: '', done: true, model: request.model, provider: this.id };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    // Deterministic pseudo-embeddings based on string length.
    const embeddings = inputs.map((text) => {
      const len = text.length;
      return [len % 10, (len * 2) % 10, (len * 3) % 10, (len * 4) % 10, (len * 5) % 10];
    });
    return {
      embeddings,
      model: request.model,
      provider: this.id,
      promptTokens: 0,
      latencyMs: 1,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Return deterministic mock JSON/text based on what pipeline stage is asking.
   */
  private mockContent(request: CompletionRequest): string {
    const prompt = request.messages.map((m) => m.content).join('\n').toLowerCase();

    // Source extraction mock.
    if (prompt.includes('source') && prompt.includes('extract')) {
      return JSON.stringify({
        title: 'Sample Course: Introduction to Concepts',
        subject: 'general',
        level: 'introductory',
        summary: 'A sample course generated in development mode.',
        units: [
          { title: 'Unit 1: Foundations', objectives: ['Define foundational terms.'] },
          { title: 'Unit 2: Application', objectives: ['Apply foundational concepts.'] },
        ],
        objectives: [
          { statement: 'Define foundational terms accurately.', category: 'knowledge', difficulty: 2, importance: 3 },
          { statement: 'Apply foundational concepts to novel situations.', category: 'skill', difficulty: 3, importance: 4 },
        ],
        terminology: ['concept', 'foundation'],
        requirements: [],
        ambiguities: [],
        confidence: 0.9,
        uncertainty: [],
      });
    }

    // Curriculum blueprint mock.
    if (prompt.includes('blueprint')) {
      return JSON.stringify({
        title: 'Sample Course: Introduction to Concepts',
        description: 'A comprehensive introduction.',
        intendedLearner: 'Beginner learners',
        assumedKnowledge: 'None',
        units: [
          {
            title: 'Unit 1: Foundations',
            description: 'Laying the groundwork.',
            topics: [{ title: 'Core Concepts' }],
            objectives: [{ statement: 'Define foundational terms accurately.', difficulty: 2, importance: 3 }],
          },
          {
            title: 'Unit 2: Application',
            description: 'Applying knowledge.',
            topics: [{ title: 'Practical Use' }],
            objectives: [{ statement: 'Apply foundational concepts to novel situations.', difficulty: 3, importance: 4 }],
          },
        ],
        prerequisites: [],
        estimatedMinutes: 240,
      });
    }

    // Lesson generation mock.
    if (prompt.includes('lesson')) {
      return JSON.stringify({
        sections: [
          { type: 'motivation', title: 'Why this matters', content: 'Understanding this concept unlocks deeper learning.' },
          { type: 'explanation', title: 'Core Explanation', content: 'The main idea explained clearly.' },
          { type: 'example', title: 'Worked Example', content: 'Here is a step-by-step example.' },
          { type: 'summary', title: 'Summary', content: 'Key takeaways.' },
        ],
        misconceptions: [
          { misconception: 'A common mistake', correction: 'The correct understanding' },
        ],
        visuals: [],
        masteryCheck: { prompt: 'Can you explain the concept in your own words?', criteria: 'Accurate explanation' },
        estimatedMinutes: 45,
      });
    }

    // Assessment generation mock.
    if (prompt.includes('assessment') || prompt.includes('question')) {
      return JSON.stringify({
        questions: [
          {
            kind: 'mcq',
            prompt: 'What is the primary definition of the concept?',
            choices: [
              { text: 'Correct answer', isCorrect: true },
              { text: 'Wrong answer A', isCorrect: false },
              { text: 'Wrong answer B', isCorrect: false },
              { text: 'Wrong answer C', isCorrect: false },
            ],
            explanation: 'The correct answer aligns with the definition.',
            misconceptions: ['Confusing related terms'],
            difficulty: 2,
          },
          {
            kind: 'short_answer',
            prompt: 'Explain the concept in one paragraph.',
            answerKey: { sampleAnswer: 'A clear explanation of the concept.' },
            explanation: 'Look for accurate use of terminology.',
            difficulty: 3,
          },
        ],
        passThreshold: 0.8,
      });
    }

    // QA mock.
    if (prompt.includes('qa') || prompt.includes('quality')) {
      return JSON.stringify({
        checks: [
          { checkKey: 'source_coverage', severity: 'info', status: 'pass', message: 'All source material covered.' },
          { checkKey: 'objective_assessment_alignment', severity: 'info', status: 'pass', message: 'All objectives have assessments.' },
        ],
        summary: 'All QA checks passed (mock).',
      });
    }

    // Prerequisite/dependency analysis mock.
    if (prompt.includes('prereq') || prompt.includes('depend')) {
      return JSON.stringify({
        dependencies: [
          { objective: 1, prerequisite: 0, strength: 'required', rationale: 'Must know foundations first.' },
        ],
        cycles: [],
        issues: [],
      });
    }

    // Default mock response.
    return JSON.stringify({
      message: 'Development fixture response (mock). No real AI was invoked.',
      provider: 'mock',
    });
  }
}