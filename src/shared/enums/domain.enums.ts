export enum IntentEnum {
  PSYCHOEDUCATION = 'psychoeducation',
  THOUGHT_EXPLORATION = 'thought_exploration',
  CBT_EXERCISE = 'cbt_exercise',
  CLARIFICATION = 'clarification',
  OUT_OF_SCOPE = 'out_of_scope',
}

export enum AgentResultStatus {
  SUCCESS = 'success',
  NEEDS_CLARIFICATION = 'needs_clarification',
  OUT_OF_SCOPE = 'out_of_scope',
  SAFETY_ESCALATION = 'safety_escalation',
  ERROR = 'error',
}

export enum SafetyStatus {
  SAFE = 'safe',
  NEEDS_ESCALATION = 'needs_escalation',
  OUT_OF_SCOPE = 'out_of_scope',
}

export enum ToolName {
  VALIDATE_INPUT = 'validate_input',
  SAFETY_CHECK = 'safety_check',
  SEARCH_KNOWLEDGE_BASE = 'search_knowledge_base',
}

export enum ToolCallExecutionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum EnvironmentVariables {
  API_KEY = 'EMBEDDING_API_KEY',
  GENERATION_MODEL = 'GEMINI_MODEL',
  FALLBACK_MODEL = 'FALLBACK_MODEL',
  DATABASE_URL = 'DATABASE_URL',
  SOURCE_PATH = 'SOURCE_PATH',
  PORT = 'PORT',
}