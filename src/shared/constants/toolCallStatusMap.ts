import { ToolCallStatus } from '#/generated/prisma/enums.js';
import { ToolCallExecutionStatus } from '#/shared/enums/domain.enums.js';

export const toolCallStatusMap: Record<ToolCallExecutionStatus, ToolCallStatus> = {
  [ToolCallExecutionStatus.SUCCESS]: ToolCallStatus.COMPLETED,
  [ToolCallExecutionStatus.ERROR]: ToolCallStatus.FAILED,
};