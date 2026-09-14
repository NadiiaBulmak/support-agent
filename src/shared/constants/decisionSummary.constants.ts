export const decisionSummaries = {
  inputValidationRejected: 'Input validation rejected the question.',
  safetyEscalationBeforePlanning:
    'Crisis language triggered safety escalation before planning.',
  scopeGuardrailRejected:
    'A deterministic scope guardrail rejected the request before planning.',
  clarificationWithoutRetrieval:
    'Planner classified the request as clarification and no retrieval was needed.',
  plannerOutOfScope: 'Planner classified the request as out of scope.',
  answerValidationPassed: (sourceCount: number) =>
    `Planner selected ${sourceCount} knowledge sources and answer validation passed.`,
  safeFallback:
    'Generation completed, but all answer validation attempts failed; returned a safe fallback.',
  workflowFailed: 'The workflow failed before a final decision could be produced.',
} as const;