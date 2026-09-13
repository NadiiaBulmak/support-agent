import { Module } from '@nestjs/common';
import { ValidateInputService } from '#/modules/tools/validate-input/validate-input.service.js';
import { SafetyCheckService } from '#/modules/tools/safety-check/safety-check.service.js';
import { SearchKnowledgeBaseTool } from '#/modules/tools/search-knowledge-base/search-knowledge-base.service.js';
import { KnowledgeModule } from '#/modules/knowledge/knowledge.module.js';
import { ToolsRegistry } from '#/modules/tools/registry/tools.registry.js';

@Module({
  imports: [KnowledgeModule],
  providers: [
    ValidateInputService,
    SafetyCheckService,
    SearchKnowledgeBaseTool,
    ToolsRegistry,
  ],
  exports: [
    ValidateInputService,
    SafetyCheckService,
    SearchKnowledgeBaseTool,
    ToolsRegistry
  ],
})
export class ToolsModule {}
// empty input
// too long input
// invalid input
// obviously malicious input
