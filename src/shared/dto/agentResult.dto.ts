import { z } from 'zod';
import { AgentResultStatus, IntentEnum } from '#/shared/enums/domain.enums.js';

export const AgentResultSchema = z.object({
  status: z.enum(AgentResultStatus),
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
    .enum(IntentEnum)
    .optional(),
});
