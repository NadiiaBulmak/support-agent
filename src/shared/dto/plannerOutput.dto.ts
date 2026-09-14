import { z } from 'zod';
import { IntentEnum } from '#/shared/enums/domain.enums.js';

export const PlannerOutputSchema = z.object({
  intent: z.enum(IntentEnum),
  needsKnowledgeSearch: z.boolean(),
  retrievalQuery: z.string().optional(),
});
