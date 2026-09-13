import { AgentResult } from '#/shared/dto/agentResult.dto.js';

export const errorResult: AgentResult = {
  status: 'error',
  answer: 'The request could not be processed.',
  sources: [],
  confidence: 0,
  decisionSummary: 'The workflow failed before a final decision could be produced.',
};