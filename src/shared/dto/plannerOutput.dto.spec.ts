import { describe, expect, it } from 'vitest';
import { PlannerOutputSchema } from '#/shared/dto/plannerOutput.dto.js';

describe('PlannerOutputSchema', () => {
  it('rejects malformed planner output', () => {
    expect(() =>
      PlannerOutputSchema.parse({
        intent: 'not_a_supported_intent',
        needsKnowledgeSearch: 'yes',
      }),
    ).toThrow();
  });

  it('accepts a semantic retrieval query', () => {
    expect(
      PlannerOutputSchema.parse({
        intent: 'thought_exploration',
        needsKnowledgeSearch: true,
        retrievalQuery: 'automatic thoughts and alternative explanations',
      }).retrievalQuery,
    ).toBe('automatic thoughts and alternative explanations');
  });
});