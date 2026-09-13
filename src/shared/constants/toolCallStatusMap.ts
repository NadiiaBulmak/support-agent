import { ToolCallStatus } from '#/generated/prisma/enums.js';
import { ToolCallLog } from '#/shared/types/agent.types.js';

export const toolCallStatusMap: Record<ToolCallLog['status'], ToolCallStatus> = {
  success: ToolCallStatus.COMPLETED,
  error: ToolCallStatus.FAILED,
};