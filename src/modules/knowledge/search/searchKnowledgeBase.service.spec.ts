import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchKnowledgeBaseService } from '#/modules/knowledge/search/searchKnowledgeBase.service.js';

describe('SearchKnowledgeBaseService', () => {
  let service: SearchKnowledgeBaseService;
  let embeddingMock: { GenerateEmbeddings: ReturnType<typeof vi.fn> };
  let repositoryMock: { findSimilarChunks: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    embeddingMock = {
      GenerateEmbeddings: vi.fn().mockResolvedValue([0.1, 0.2]),
    };
    repositoryMock = {
      findSimilarChunks: vi.fn(),
    };
    service = new SearchKnowledgeBaseService(
      embeddingMock as never,
      repositoryMock as never,
    );
  });

  it('returns relevant results when found', async () => {
    const databaseResults = [
      { id: '1', content: 'CBT concept', chunkIndex: 0, documentId: 'doc-1', distance: 0.1 },
    ];
    repositoryMock.findSimilarChunks.mockResolvedValue(databaseResults);

    const results = await service.search('What is CBT?', 3);

    expect(embeddingMock.GenerateEmbeddings).toHaveBeenCalledWith('What is CBT?');
    expect(repositoryMock.findSimilarChunks).toHaveBeenCalledWith([0.1, 0.2], 3);
    expect(results).toEqual(databaseResults);
  });

  it('returns an empty result when no chunks are found', async () => {
    repositoryMock.findSimilarChunks.mockResolvedValue([]);

    await expect(service.search('Aliens')).resolves.toEqual([]);
  });
});
