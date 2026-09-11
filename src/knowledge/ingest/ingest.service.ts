import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service.js';
import { readFile } from 'fs/promises';
import path from 'path/win32';
import { cleanText } from '../../utils/cleanText.util.js';
import { chunkText } from '../../utils/chunkText.util.js';
import { KnowledgeRepository } from '../knowledge.repository.js';
import { delay } from '../../utils/delay.js';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly sourcePath =
    process.env.SOURCE_PATH || './knowledge/sources/';
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly knowledgeRepository: KnowledgeRepository,
  ) {}

  public async readSourceFiles(fileName: string): Promise<string> {
    this.logger.log(`Reading source files from ${this.sourcePath}`);
    const pathName = path.join(process.cwd(), this.sourcePath, fileName);

    return await readFile(pathName, 'utf8');
  }

  public async ingestKnowledge(): Promise<void> {
    this.logger.log(`Ingesting knowledge from ${this.sourcePath}`);

    const fileName = 'cbt-material.md';
    const fileData = cleanText(await this.readSourceFiles(fileName));
    const chunks = await chunkText(fileData);

    this.logger.log(`Ingesting ${chunks.length} chunks of knowledge`);

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await this.embeddingService.GenerateEmbeddings(chunk);
        await delay(500);
        return { content: chunk, embedding };
      }),
    );

    const document = await this.knowledgeRepository.saveDocumentWithChunks(
      fileName,
      this.sourcePath,
      embeddings,
    );

    // this.logger.log(`Ingested document with ID: ${document.id} and ${embeddings.length} chunks`);
  }
}
