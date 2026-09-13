import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '@nestjs/common';
import { errorMessages } from '#/shared/constants/errorMessages.js';

@Injectable()
export class EmbeddingService {
  private genAI?: GoogleGenerativeAI;
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('EMBEDDING_API_KEY');
    if (!apiKey) {
      this.logger.error(errorMessages.embeddingApiKeyMissing);
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  public async GenerateEmbeddings(input: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error(errorMessages.embeddingApiKeyMissing);
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-2',
    });
    const result = await model.embedContent(input);
    const vector = result.embedding?.values;

    if (
      !Array.isArray(vector) ||
      vector.length !== 3072 ||
      vector.some((value) => !Number.isFinite(value))
    ) {
      throw new Error(errorMessages.invalidEmbeddingVector);
    }

    return vector;
  }
}
