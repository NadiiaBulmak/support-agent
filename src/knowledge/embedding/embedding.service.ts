import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('EMBEDDING_API_KEY');
    if (!apiKey) {
      this.logger.error(
        'EMBEDDING_API_KEY is not set in the environment variables.',
      );
      throw new Error(
        'EMBEDDING_API_KEY is not set in the environment variables.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async GenerateEmbeddings(input: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-embedding-2',
    });
    const result = await model.embedContent(input);
    return result.embedding.values;
  }
}
