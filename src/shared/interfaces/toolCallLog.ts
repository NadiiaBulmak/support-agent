import { ToolCallExecutionStatus } from '#/shared/enums/domain.enums.js';

export interface ToolCallLog {
	toolName: string;
	input: Record<string, unknown>;
	output: unknown;
	status: ToolCallExecutionStatus;
	durationMs: number;
}
