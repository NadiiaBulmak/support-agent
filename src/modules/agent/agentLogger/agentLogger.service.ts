import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '#/modules/db/prisma/prisma.service.js';
import { AgentResult } from '#/shared/dto/agentResult.dto.js';
import { AgentRunStatus } from '#/generated/prisma/browser.js';
import { ToolCallLog } from '#/shared/types/agent.types.js';
import { toolCallStatusMap } from '#/shared/constants/toolCallStatusMap.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class AgentLoggerService {
  private readonly logger = new Logger(AgentLoggerService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async logRun(
    question: string,
    result: AgentResult,
    durationMs: number,
  ): Promise<string | null> {
    this.logger.log(loggerMessages.logRun(durationMs, result));
    this.logger.log(`Decision summary: ${result.decisionSummary}`);

    try {
      const runRecord = await this.prisma.agentRun.create({
        data: {
          question,
          status: result.status.toUpperCase() as AgentRunStatus,
          intent: result.intent || null,
          answer: result.answer,
          confidence: result.confidence,
          durationMs,
        },
      });
      return runRecord.id;
    } catch (error) {
      this.logger.error(errorMessages.failedToPersist, error);
      return null;
    }
  }

  public async logToolCall(
    agentRunId: string | null,
    toolCall: ToolCallLog,
  ): Promise<void> {
    this.logger.log(loggerMessages.logToolCall(toolCall));

    if (!agentRunId) return;

    try {
      await this.prisma.toolCall.create({
        data: {
          agentRunId,
          toolName: toolCall.toolName,
          input: JSON.stringify(toolCall.input),
          output: JSON.stringify(toolCall.output),
          status: toolCallStatusMap[toolCall.status],
          durationMs: toolCall.durationMs,
        },
      });
    } catch (error) {
      this.logger.error(
        errorMessages.failedToPersistToolCall(toolCall.toolName),
        error,
      );
    }
  }
}
