import { Module } from '@nestjs/common';
import { IngestService } from './ingest/ingest.service.js';
import { EmbeddingService } from './embedding/embedding.service.js';
import { DbModule } from '../db/db.module.js';
import { KnowledgeRepository } from './knowledge.repository.js';

@Module({
  imports: [DbModule],
  providers: [IngestService, EmbeddingService, KnowledgeRepository],
  exports: [KnowledgeRepository],
})
export class KnowledgeModule {}
