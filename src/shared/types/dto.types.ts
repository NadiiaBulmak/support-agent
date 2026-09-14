import type { z } from 'zod';
import type { AgentResultSchema } from '#/shared/dto/agentResult.dto.js';
import type { PlannerOutputSchema } from '#/shared/dto/plannerOutput.dto.js';
import type { RunAgentDtoSchema } from '#/shared/dto/runAgent.dto.js';
import type { SearchKnowledgeBaseSchema } from '#/shared/dto/searchKnowledgeBase.dto.js';

export type AgentResult = z.infer<typeof AgentResultSchema>;
export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type RunAgentDto = z.infer<typeof RunAgentDtoSchema>;
export type SearchKnowledgeBaseDto = z.infer<typeof SearchKnowledgeBaseSchema>;