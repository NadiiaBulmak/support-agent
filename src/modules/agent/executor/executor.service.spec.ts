import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutorService } from '#/modules/agent/executor/executor.service.js';

describe('ExecutorService', () => {
  let toolsRegistry: { execute: ReturnType<typeof vi.fn> };
  let plannerService: { plan: ReturnType<typeof vi.fn> };
  let llmService: { generateAnswer: ReturnType<typeof vi.fn> };
  let answerValidatorService: { validateAnswer: ReturnType<typeof vi.fn> };
  let service: ExecutorService;

  beforeEach(() => {
    toolsRegistry = { execute: vi.fn() };
    plannerService = { plan: vi.fn() };
    llmService = { generateAnswer: vi.fn() };
    answerValidatorService = { validateAnswer: vi.fn() };
    service = new ExecutorService(
      toolsRegistry as never,
      answerValidatorService as never,
      plannerService as never,
      llmService as never,
    );
  });

  it('continues with supportive generation when retrieval returns no chunks', async () => {
    toolsRegistry.execute.mockImplementation((name: string) => {
      if (name === 'validate_input') return { isValid: true };
      if (name === 'safety_check') return 'safe';
      return Promise.resolve([]);
    });
    plannerService.plan.mockResolvedValue({
      intent: 'thought_exploration',
      needsKnowledgeSearch: true,
      retrievalQuery: 'mind reading and alternative explanations',
    });
    llmService.generateAnswer.mockResolvedValue(
      'It sounds difficult. What evidence supports this thought, and what evidence might point to another explanation?',
    );
    answerValidatorService.validateAnswer.mockReturnValue({
      valid: true,
      grounded: false,
      issues: [],
    });

    const result = await service.execute('People may dislike me.', []);

    expect(result.status).toBe('success');
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain('What evidence');
    expect(toolsRegistry.execute).toHaveBeenCalledWith('search_knowledge_base', {
      query: 'mind reading and alternative explanations',
      limit: 3,
    });
  });

  it('retries generation after answer validation fails', async () => {
    toolsRegistry.execute.mockImplementation((name: string) => {
      if (name === 'validate_input') return { isValid: true };
      if (name === 'safety_check') return 'safe';
      return Promise.resolve([{ id: 'chunk-1', content: 'CBT context', distance: 0.1 }]);
    });
    plannerService.plan.mockResolvedValue({
      intent: 'psychoeducation',
      needsKnowledgeSearch: true,
    });
    llmService.generateAnswer
      .mockResolvedValueOnce('First answer')
      .mockResolvedValueOnce('Second answer');
    answerValidatorService.validateAnswer
      .mockReturnValueOnce({ valid: false, grounded: true, issues: ['not grounded enough'] })
      .mockReturnValueOnce({ valid: true, grounded: true, issues: [] });

    const result = await service.execute('What is CBT?', []);

    expect(result.answer).toBe('Second answer');
    expect(llmService.generateAnswer).toHaveBeenCalledTimes(2);
  });

  it('propagates search failures for AgentService error handling', async () => {
    toolsRegistry.execute.mockImplementation((name: string) => {
      if (name === 'validate_input') return { isValid: true };
      if (name === 'safety_check') return 'safe';
      return Promise.reject(new Error('database unavailable'));
    });
    plannerService.plan.mockResolvedValue({
      intent: 'psychoeducation',
      needsKnowledgeSearch: true,
    });

    await expect(service.execute('What is CBT?', [])).rejects.toThrow(
      'database unavailable',
    );
  });

  it('propagates LLM failures after retrieval succeeds', async () => {
    toolsRegistry.execute.mockImplementation((name: string) => {
      if (name === 'validate_input') return { isValid: true };
      if (name === 'safety_check') return 'safe';
      return Promise.resolve([{ id: 'chunk-1', content: 'CBT context', distance: 0.1 }]);
    });
    plannerService.plan.mockResolvedValue({
      intent: 'psychoeducation',
      needsKnowledgeSearch: true,
    });
    llmService.generateAnswer.mockRejectedValue(new Error('LLM unavailable'));

    await expect(service.execute('What is CBT?', [])).rejects.toThrow(
      'LLM unavailable',
    );
  });
});