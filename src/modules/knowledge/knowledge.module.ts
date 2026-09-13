import { Module } from '@nestjs/common';
import { IngestService } from '#/modules/knowledge/ingest/ingest.service.js';
import { EmbeddingService } from '#/modules/knowledge/embedding/embedding.service.js';
import { DbModule } from '#/modules/db/db.module.js';
import { KnowledgeRepository } from '#/modules/knowledge/knowledge.repository.js';
import { SearchKnowledgeBaseService } from '#/modules/knowledge/search/searchKnowledgeBase.service.js';

@Module({
  imports: [DbModule],
  providers: [
    IngestService,
    EmbeddingService,
    KnowledgeRepository,
    SearchKnowledgeBaseService,
  ],
  exports: [KnowledgeRepository, SearchKnowledgeBaseService],
})
export class KnowledgeModule {}
