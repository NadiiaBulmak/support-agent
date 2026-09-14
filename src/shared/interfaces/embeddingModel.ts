export interface EmbeddingModel {
  name?: string;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export interface ModelsResponse {
  models?: EmbeddingModel[];
}