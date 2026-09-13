import { Module } from '@nestjs/common';
import { AgentController } from '#/modules/agent/agent.controller.js';
import { AgentService } from '#/modules/agent/agent.service.js';
import { PlannerService } from '#/modules/agent/planner/planner.service.js';
import { ExecutorService } from '#/modules/agent/executor/executor.service.js';
import { ToolsModule } from '#/modules/tools/tools.module.js';
import { LlmService } from '#/modules/agent/llm/llm.service.js';
import { DbModule } from '#/modules/db/db.module.js';
import { ValidationModule } from '#/modules/validation/validation.module.js';
import { AgentLoggerService } from '#/modules/agent/agentLogger/agentLogger.service.js';
import { KnowledgeModule } from '#/modules/knowledge/knowledge.module.js';

@Module({
  imports: [ToolsModule, ValidationModule, DbModule, KnowledgeModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentLoggerService,
    PlannerService,
    LlmService,
    ExecutorService,
  ],
  exports: [AgentService, AgentLoggerService, ExecutorService],
})
export class AgentModule {}
