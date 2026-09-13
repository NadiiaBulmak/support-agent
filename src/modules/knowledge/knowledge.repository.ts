import { Injectable } from '@nestjs/common';
import { PrismaService } from '#/modules/db/prisma/prisma.service.js';
import { SearchResultChunk } from '#/shared/types/knowledgeRepository.types.js';

@Injectable()
export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async saveDocumentWithChunks(
    fileName: string,
    sourcePath: string,
    embeddings: { content: string; embedding: number[] }[],
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

  public async findSimilarChunks(
    vector: number[],
    limit: number = 4,
  ): Promise<SearchResultChunk[]> {
    const vectorString = `[${vector.join(',')}]`;

    return await this.prisma.$queryRaw<SearchResultChunk[]>`
      SELECT 
        "id",
        "content",
        "chunkIndex",
        "documentId",
        ("embedding" <=> ${vectorString}::vector) AS "distance"
      FROM "document_chunks"
      ORDER BY "distance" ASC
      LIMIT ${limit};
    `;
  }
}
