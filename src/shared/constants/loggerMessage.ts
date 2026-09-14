import { ToolCallLog } from '#/shared/interfaces/toolCallLog.js';
import { AgentResult } from '#/shared/types/dto.types.js';
import { IntentEnum } from '#/shared/enums/domain.enums.js';

export const loggerMessages = {
  agentRunStarted: (question: string) =>
    `Starting agent run for question: "${question}"`,
  workflowStarted: (question: string) =>
    `Executing workflow for question: "${question}"`,
  logRun: (durationMs: number, result: AgentResult) =>
    `Agent Run completed in ${durationMs}ms | Status: ${result.status} | Intent: ${result.intent || 'N/A'} | Decision: ${result.decisionSummary}`,
  logToolCall: (toolCall: ToolCallLog) =>
    `Tool Call [${toolCall.toolName}] executed in ${toolCall.durationMs}ms | Status: ${toolCall.status}`,
  safetyEscalation: 'Safety check triggered: needs_escalation',
  outOfScope: 'Safety check triggered: out_of_scope',
  searchToolFailed: 'Search tool failed:',
  generationAttempt: (attempt: number, maxAttempts: number) =>
    `Generation attempt ${attempt}/${maxAttempts}`,
  answerPassedValidation: (attempt: number) =>
    `Answer passed validation on attempt ${attempt}`,
  validationFailed: (attempt: number, issues: string[]) =>
    `Attempt ${attempt} failed validation: ${issues.join(', ')}`,
  allGenerationAttemptsFailed:
    'All generation attempts failed validation. Returning safe fallback.',
  generatingAnswer: (intent?: IntentEnum) =>
    `Generating answer for intent: "${intent || 'unknown'}"`,
  generationAttemptFailed: (attempt: number, model: string, error: unknown) =>
    `Generation attempt ${attempt} using ${model} failed: ${error instanceof Error ? error.message : error}`,
  planning: (question: string) => `Planning for question: "${question}"`,
  plannerOutput: (attempt: number, intent: IntentEnum, needsSearch: boolean) =>
    `Planner output (Attempt ${attempt}): Intent = ${intent}, NeedsSearch = ${needsSearch}`,
  plannerAttemptFailed: (attempt: number, model: string, error: unknown) =>
    `Planner attempt ${attempt} using ${model} failed: ${error instanceof Error ? error.message : error}`,
  plannerFallback: 'All Planner attempts failed. Returning fallback plan.',
  databaseConnectionFailed: 'Failed to connect to the database:',
  readingSourceFiles: (sourcePath: string) => `Reading source files from ${sourcePath}`,
  ingestingKnowledge: (sourcePath: string) => `Ingesting knowledge from ${sourcePath}`,
  ingestingChunks: (count: number) => `Ingesting ${count} chunks of knowledge`,
  searchingKnowledgeBase: (query: string) =>
    `Searching knowledge base for query: "${query}"`,
  relevantChunksFound: (count: number) => `Found ${count} relevant chunks`,
  safetyKeyword: (keyword: string) =>
    `Safety escalation triggered by keyword: "${keyword}"`,
  outOfScopeKeyword: (keyword: string) =>
    `Out of scope request triggered by keyword: "${keyword}"`,
  toolCalled: (toolName: string, query: string) =>
    `Tool ${toolName} called with query: "${query}"`,
  toolExecutionFailed: (toolName: string) => `Error executing ${toolName}`,
  validationEmptyInput: 'Validation failed: Empty input.',
  validationInputTooLong: (length: number, maxLength: number) =>
    `Validation failed: Input length (${length}) exceeds maximum (${maxLength}).`,
  validationComplete: (valid: boolean, grounded: boolean) =>
    `Validation complete. Valid: ${valid}, Grounded: ${grounded}`,
};
