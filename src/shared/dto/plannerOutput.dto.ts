import { z } from 'zod';

export const PlannerOutputSchema = z.object({
  intent: z.enum([
    'psychoeducation',
    'thought_exploration',
    'cbt_exercise',
    'clarification',
    'out_of_scope',
  ]),
  needsKnowledgeSearch: z.boolean(),
  retrievalQuery: z.string().optional(),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;