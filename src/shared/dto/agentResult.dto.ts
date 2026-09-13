import { z } from 'zod';

export const AgentResultSchema = z.object({
  status: z.enum([
    'success',
    'needs_clarification',
    'out_of_scope',
    'safety_escalation',
    'error',
  ]),
  answer: z.string(),
  sources: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      documentTitle: z.string().optional(),
      section: z.string().optional(),
      similarity: z.number().optional(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  decisionSummary: z.string(),
  intent: z
    .enum([
      'psychoeducation',
      'thought_exploration',
      'cbt_exercise',
      'clarification',
      'out_of_scope',
    ])
    .optional(),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;