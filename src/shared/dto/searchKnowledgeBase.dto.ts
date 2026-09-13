import { z } from 'zod';

export const SearchKnowledgeBaseSchema = z.object({
  query: z
    .string()
    .describe(`Search query for the knowledge base. The query should be in the same language as the knowledge base content.`),
  limit: z
    .number()
    .optional()
    .default(3)
    .describe('Number of relevant chunks to return. Default is 3.'),
});

export type SearchKnowledgeBaseDto = z.infer<typeof SearchKnowledgeBaseSchema>;
