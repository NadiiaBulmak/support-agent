export const errorMessages = {
  failedToPersist: 'Failed to persist agent run to DB:',
  failedToPersistToolCall: (toolName: string) => `Failed to persist tool call [${toolName}] to DB:`,
  invalidInput: 'Invalid input provided.',
  inputTooLong: (maxLength: number) => `Input exceeds maximum length of ${maxLength} characters.`,
  executionFailed: (errorCategory: string) => `Agent execution failed (${errorCategory}):`,
  questionEmpty: 'Question cannot be empty.',
  questionTooLong: (maxLength: number) =>
    `Question is too long. Maximum allowed length is ${maxLength} characters.`,
  safetyEscalation:
    'If you are experiencing severe distress or thoughts of self-harm, please reach out immediately to local emergency services or a crisis helpline. You are not alone.',
  medicalAdviceNotSupported:
    'I cannot assist with medical diagnoses, prescriptions, or medication advice. Please consult a qualified medical professional.',
  clarificationNeeded:
    'Could you please share a bit more context or detail about what you are experiencing so I can better support you?',
  requestOutOfScope: 'This request falls outside the scope of CBT psychoeducation and self-reflection.',
  noRelevantInformation: 'No relevant information found in the knowledge base for your query.',
  supportiveFallback:
    'It sounds difficult to keep having this thought. We can slow it down by separating what you know for certain from what you may be assuming, and looking for one alternative explanation.',
  unknownError: 'Unknown error',
  searchToolFailed: 'Search tool failed:',
  llmApiKeyMissing: 'LLM_API_KEY is not set.',
  invalidLlmResponse: 'LLM returned an invalid response: empty response.',
  llmGenerationFailed: 'LLM generation failed after retries.',
  embeddingApiKeyMissing: 'LLM_API_KEY is not set in the environment variables.',
  invalidEmbeddingVector: 'Embedding API returned an invalid vector.',
  knowledgeSearchFailed: 'An error occurred while searching the knowledge base.',
  scriptExecutionFailed: 'Script execution failed:',
};