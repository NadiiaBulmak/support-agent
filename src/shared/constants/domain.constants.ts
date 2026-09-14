import { getEncoding } from 'js-tiktoken';

export const DEFAULT_SEARCH_LIMIT = 3;
export const KNOWLEDGE_REPOSITORY_DEFAULT_LIMIT = 4;
export const MAX_GENERATION_ATTEMPTS = 2;
export const EMBEDDING_MODEL = 'gemini-embedding-2';
export const EMBEDDING_DIMENSIONS = 3072;
export const DEFAULT_GENERATION_MODEL = 'gemini-3.5-flash-lite';
export const encoding = getEncoding('cl100k_base');
export const chunkSize = 800;
export const chunkOverlap = 100;