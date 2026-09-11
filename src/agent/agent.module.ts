import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';
import { PlannerService } from './planner/planner.service.js';
import { ExecutorService } from './executor/executor.service.js';

@Module({
  controllers: [AgentController],
  providers: [AgentService, PlannerService, ExecutorService]
})
export class AgentModule {}
