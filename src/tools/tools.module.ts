import { Module } from '@nestjs/common';
import { ValidateInputService } from './validate-input/validate-input.service.js';
import { SafetyCheckService } from './safety-check/safety-check.service.js';
import { SearchKnowledgeBaseService } from './search-knowledge-base/search-knowledge-base.service.js';

@Module({
  providers: [ValidateInputService, SafetyCheckService, SearchKnowledgeBaseService]
})
export class ToolsModule {}
// empty input
// too long input
// invalid input
// obviously malicious input
