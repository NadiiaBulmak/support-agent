import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '#/modules/knowledge/embedding/embedding.service.js';
import { readFile } from 'fs/promises';
import path from 'path/win32';
import { cleanText } from '#/shared/utils/cleanText.util.js';
import { chunkText } from '#/shared/utils/chunkText.util.js';
import { KnowledgeRepository } from '#/modules/knowledge/knowledge.repository.js';
import { delay } from '#/shared/utils/delay.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

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
    this.logger.log(loggerMessages.readingSourceFiles(this.sourcePath));
    const pathName = path.join(process.cwd(), this.sourcePath, fileName);

    return await readFile(pathName, 'utf8');
  }

  public async ingestKnowledge(): Promise<void> {
    this.logger.log(loggerMessages.ingestingKnowledge(this.sourcePath));

    const fileName = process.env.FILE_NAME || 'cbt-material.md';
    const fileData = cleanText(await this.readSourceFiles(fileName));
    const chunks = await chunkText(fileData);

    this.logger.log(loggerMessages.ingestingChunks(chunks.length));

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await this.embeddingService.GenerateEmbeddings(chunk);
        await delay(500);
        return { content: chunk, embedding };
      }),
    );

    await this.knowledgeRepository.saveDocumentWithChunks(
      fileName,
      this.sourcePath,
      embeddings,
    );
  }
}
