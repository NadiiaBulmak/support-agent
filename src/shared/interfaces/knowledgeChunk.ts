export interface KnowledgeChunk {
  id: string;
  content: string;
  documentTitle?: string;
  section?: string;
  similarity?: number;
}