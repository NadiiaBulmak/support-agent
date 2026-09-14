import { Injectable, Logger } from '@nestjs/common';
import { ExecutorService } from '#/modules/agent/executor/executor.service.js';
import { AgentResult } from '#/shared/types/dto.types.js';
import { AgentLoggerService } from '#/modules/agent/agentLogger/agentLogger.service.js';
import { ToolCallLog } from '#/shared/interfaces/toolCallLog.js';
import { getExternalErrorCategory } from '#/shared/utils/external-error.util.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { errorResult } from '#/shared/constants/errorResult.js';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly executorService: ExecutorService,
    private readonly agentLogger: AgentLoggerService,
  ) {}

  public async run(question: string): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.log(loggerMessages.agentRunStarted(question));

    const toolLogs: ToolCallLog[] = [];

    try {
      const result = await this.executorService.execute(question, toolLogs);
      const durationMs = Date.now() - startTime;

      const runId = await this.agentLogger.logRun(question, result, durationMs);

      if (runId && toolLogs.length > 0) {
        for (const log of toolLogs) {
          await this.agentLogger.logToolCall(runId, log);
        }
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorCategory = getExternalErrorCategory(error);
      this.logger.error(errorMessages.executionFailed(errorCategory), error);

      const runId = await this.agentLogger.logRun(
        question,
        errorResult,
        durationMs,
      );

      if (runId && toolLogs.length > 0) {
        for (const log of toolLogs) {
          await this.agentLogger.logToolCall(runId, log);
        }
      }

      return errorResult;
    }
  }
}
