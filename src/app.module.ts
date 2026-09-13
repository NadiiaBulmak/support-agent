import { Module } from '@nestjs/common';
import { AgentModule } from '#/modules/agent/agent.module.js';
import { ToolsModule } from '#/modules/tools/tools.module.js';
import { KnowledgeModule } from '#/modules/knowledge/knowledge.module.js';
import { ValidationModule } from '#/modules/validation/validation.module.js';
import { DbModule } from '#/modules/db/db.module.js';
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
