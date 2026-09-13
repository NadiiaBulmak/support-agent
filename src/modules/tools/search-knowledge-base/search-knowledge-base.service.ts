import { Injectable, Logger } from '@nestjs/common';
import { SearchKnowledgeBaseDto, SearchKnowledgeBaseSchema } from '#/shared/dto/searchKnowledgeBase.dto.js';
import { SearchKnowledgeBaseService } from '#/modules/knowledge/search/searchKnowledgeBase.service.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import { SYSTEM_PROMPT } from '#/shared/constants/systemPrompts.js';
import { SearchResultChunk } from '#/shared/types/knowledgeRepository.types.js';

@Injectable()
export class SearchKnowledgeBaseTool {
    private readonly logger = new Logger(SearchKnowledgeBaseService.name);

  public readonly name = 'search_knowledge_base';
  public readonly description = SYSTEM_PROMPT.tools.searchKnowledgeBase.description;
  public readonly schema = SearchKnowledgeBaseSchema;
  
  constructor(private readonly searchService: SearchKnowledgeBaseService) {}

  public async search(input: SearchKnowledgeBaseDto): Promise<SearchResultChunk[]> {
    this.logger.log(loggerMessages.toolCalled(this.name, input.query));
    return this.searchService.search(input.query, input.limit);
  }

  public async execute(input: SearchKnowledgeBaseDto): Promise<string> {
    try {
      const results = await this.search(input);

      if (!results || results.length === 0) {
        return errorMessages.noRelevantInformation;
      }

      const formattedContext = results
        .map(
          (chunk, index) =>
            `--- [Source ${index + 1} (Relevance: ${(1 - chunk.distance).toFixed(2)})] ---\n${chunk.content}`,
        )
        .join('\n\n');

      return formattedContext;
    } catch (error) {
      this.logger.error(loggerMessages.toolExecutionFailed(this.name), error);
      return errorMessages.knowledgeSearchFailed;
    }
  }
}