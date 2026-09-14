export interface SearchResultChunk {
  id: string;
  content: string;
  chunkIndex: number;
  documentId: string;
  distance: number;
}