import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateInputService } from '#/modules/tools/validate-input/validate-input.service.js';

describe('ValidateInputService', () => {
  let service: ValidateInputService;

  beforeEach(() => {
    service = new ValidateInputService();
  });

  it('accepts normal input', () => {
    expect(service.validate('What is CBT?')).toEqual({ isValid: true });
  });

  it('rejects empty input', () => {
    const result = service.validate('   ');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects input longer than 1000 characters', () => {
    const result = service.validate('a'.repeat(1001));

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('too long');
  });

  it('accepts input at the maximum length', () => {
    expect(service.validate('a'.repeat(1000)).isValid).toBe(true);
  });
});
