import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module.js';
import { ToolsModule } from './tools/tools.module.js';
import { KnowledgeModule } from './knowledge/knowledge.module.js';
import { ValidationModule } from './validation/validation.module.js';
import { DbModule } from './db/db.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AgentModule,
    ToolsModule,
    KnowledgeModule,
    ValidationModule,
    DbModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
