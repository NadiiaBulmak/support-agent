import { describe, expect, it, vi } from 'vitest';
import { AgentService } from '#/modules/agent/agent.service.js';

describe('AgentService', () => {
  it('keeps the user result when run persistence is unavailable', async () => {
    const executorService = {
      execute: vi.fn().mockResolvedValue({
        status: 'success',
        answer: 'Answer',
        sources: [],
        confidence: 0.9,
        decisionSummary: 'Answer validated.',
      }),
    };
    const agentLogger = {
      logRun: vi.fn().mockResolvedValue(null),
      logToolCall: vi.fn(),
    };
    const service = new AgentService(executorService as never, agentLogger as never);

    await expect(service.run('What is CBT?')).resolves.toMatchObject({
      status: 'success',
      decisionSummary: 'Answer validated.',
    });
    expect(agentLogger.logToolCall).not.toHaveBeenCalled();
  });
});