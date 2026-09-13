import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '#/modules/knowledge/embedding/embedding.service.js';
import { KnowledgeRepository } from '#/modules/knowledge/knowledge.repository.js';
import { SearchResultChunk } from '#/shared/types/knowledgeRepository.types.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class SearchKnowledgeBaseService {
  private readonly logger = new Logger(SearchKnowledgeBaseService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly knowledgeRepo: KnowledgeRepository,
  ) {}

  public async search(query: string, limit: number = 3): Promise<SearchResultChunk[]> {
    this.logger.log(loggerMessages.searchingKnowledgeBase(query));

    const queryVector = await this.embeddingService.GenerateEmbeddings(query);

    const results = await this.knowledgeRepo.findSimilarChunks(queryVector, limit);

    this.logger.log(loggerMessages.relevantChunksFound(results.length));
    return results;
  }
}