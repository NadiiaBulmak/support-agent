import { Module } from '@nestjs/common';
import { IngestService } from './ingest/ingest.service.js';
import { EmbeddingService } from './embedding/embedding.service.js';

@Module({
  providers: [IngestService, EmbeddingService]
})
export class KnowledgeModule {}
