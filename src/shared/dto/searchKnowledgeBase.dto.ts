import { z } from 'zod';
import { DEFAULT_SEARCH_LIMIT } from '#/shared/constants/domain.constants.js';

export const SearchKnowledgeBaseSchema = z.object({
  query: z
    .string()
    .describe(
      `Search query for the knowledge base. The query should be in the same language as the knowledge base content.`,
    ),
  limit: z
    .number()
    .optional()
    .default(DEFAULT_SEARCH_LIMIT)
    .describe(
      `Number of relevant chunks to return. Default is ${DEFAULT_SEARCH_LIMIT}.`,
    ),
});
