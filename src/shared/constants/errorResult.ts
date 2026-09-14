import { AgentResultStatus } from '#/shared/enums/domain.enums.js';
import { AgentResult } from '#/shared/types/dto.types.js';
import { decisionSummaries } from '#/shared/constants/decisionSummary.constants.js';

export const errorResult: AgentResult = {
  status: AgentResultStatus.ERROR,
  answer: 'The request could not be processed.',
  sources: [],
  confidence: 0,
  decisionSummary: decisionSummaries.workflowFailed,
};