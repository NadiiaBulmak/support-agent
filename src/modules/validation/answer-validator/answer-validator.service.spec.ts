import { beforeEach, describe, expect, it } from 'vitest';
import { AnswerValidatorService } from '#/modules/validation/answer-validator/answer-validator.service.js';
import { IntentEnum } from '#/shared/enums/domain.enums.js';  

describe('AnswerValidatorService', () => {
  let service: AnswerValidatorService;

  beforeEach(() => {
    service = new AnswerValidatorService();
  });

  it('accepts a grounded answer', () => {
    const result = service.validateAnswer('CBT helps reframe negative thoughts.', 2);

    expect(result).toEqual({ valid: true, grounded: true, issues: [] });
  });

  it('accepts CBT psychoeducation that mentions therapy', () => {
    const result = service.validateAnswer(
      'Cognitive restructuring is a technique used in cognitive behavioral therapy.',
      1,
    );

    expect(result).toEqual({ valid: true, grounded: true, issues: [] });
  });

  it('rejects an ungrounded answer', () => {
    const result = service.validateAnswer('Here is some advice...', 0);

    expect(result.valid).toBe(false);
    expect(result.grounded).toBe(false);
    expect(result.issues[0]).toContain('ungrounded');
  });

  it('accepts supportive thought exploration without retrieved chunks', () => {
    const result = service.validateAnswer(
      'It sounds difficult. What evidence supports this thought, and what evidence might point to another explanation?',
      0,
      IntentEnum.THOUGHT_EXPLORATION,
    );

    expect(result).toEqual({ valid: true, grounded: false, issues: [] });
  });

  it('rejects medical advice', () => {
    const result = service.validateAnswer(
      'You should take this medication for depression.',
      1,
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.includes('medical'))).toBe(true);
  });
});
