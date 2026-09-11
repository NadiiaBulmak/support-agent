import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma/prisma.service.js';

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async saveDocumentWithChunks(
    fileName: string, 
    sourcePath: string, 
    embeddings: { content: string; embedding: number[] }[]
  ) {
    const document = await this.prisma.document.create({
      data: { title: fileName, sourceUrl: sourcePath },
    });

    const queries = embeddings.map((e, index) => {
      const vectorString = `[${e.embedding.join(',')}]`;

      return this.prisma.$executeRaw`
        INSERT INTO "document_chunks" (
          "id",
          "documentId", 
          "chunkIndex", 
          "content", 
          "embedding",
          "createdAt"
        ) VALUES (
          gen_random_uuid(),
          ${document.id}, 
          ${index}, 
          ${e.content}, 
          ${vectorString}::vector, 
          NOW()
        );
      `;
    });

    await this.prisma.$transaction(queries);
  }
}