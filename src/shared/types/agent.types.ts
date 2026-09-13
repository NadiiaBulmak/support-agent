export type Intent =
  | 'psychoeducation'
  | 'thought_exploration'
  | 'cbt_exercise'
  | 'clarification'
  | 'out_of_scope';

export interface KnowledgeChunk {
  id: string;
  content: string;
  documentTitle?: string;
  section?: string;
  similarity?: number;
}

export interface ToolCallLog {
  toolName: string;
  input: Record<string, any>;
  output: any;
  status: 'success' | 'error';
  durationMs: number;
}