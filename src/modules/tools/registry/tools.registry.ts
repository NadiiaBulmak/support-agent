import { Injectable } from '@nestjs/common';
import { SearchKnowledgeBaseTool } from '#/modules/tools/search-knowledge-base/search-knowledge-base.service.js';
import { SYSTEM_PROMPT } from '#/shared/constants/systemPrompts.js';
import { ValidateInputService } from '#/modules/tools/validate-input/validate-input.service.js';
import { SafetyCheckService } from '#/modules/tools/safety-check/safety-check.service.js';
import { SearchKnowledgeBaseDto } from '#/shared/dto/searchKnowledgeBase.dto.js';

@Injectable()
export class ToolsRegistry {
  constructor(
    public readonly searchKnowledgeBaseTool: SearchKnowledgeBaseTool,
    private readonly validateInputService: ValidateInputService,
    private readonly safetyCheckService: SafetyCheckService,
  ) {}

  public getToolsList() {
    return [
      { name: 'validate_input', execute: (input: string) => this.validateInputService.validate(input) },
      { name: 'safety_check', execute: (input: string) => this.safetyCheckService.check(input) },
      {
        name: this.searchKnowledgeBaseTool.name,
        execute: (input: SearchKnowledgeBaseDto) =>
          this.searchKnowledgeBaseTool.search(input),
      },
    ];
  }

  public execute(
    name: 'validate_input',
    input: string,
  ): ReturnType<ValidateInputService['validate']>;
  public execute(
    name: 'safety_check',
    input: string,
  ): ReturnType<SafetyCheckService['check']>;
  public execute(
    name: 'search_knowledge_base',
    input: SearchKnowledgeBaseDto,
  ): ReturnType<SearchKnowledgeBaseTool['search']>;
  public execute(name: string, input: unknown): unknown {
    const tool = this.getToolsList().find((candidate) => candidate.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return tool.execute(input as never);
  }

  public getGeminiToolDeclarations() {
    return [
      {
        name: this.searchKnowledgeBaseTool.name,
        description: SYSTEM_PROMPT.tools.searchKnowledgeBase.description,
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: SYSTEM_PROMPT.tools.searchKnowledgeBase.queryDescription,
            },
            limit: {
              type: 'NUMBER',
              description: SYSTEM_PROMPT.tools.searchKnowledgeBase.limitDescription,
            },
          },
          required: ['query'],
        },
      },
    ];
  }
}
