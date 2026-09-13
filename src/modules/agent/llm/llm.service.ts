import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KnowledgeChunk } from '#/shared/types/agent.types.js';
import { SYSTEM_PROMPT } from '#/shared/constants/systemPrompts.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import {
  isRetryableGeminiError,
  waitBeforeGeminiRetry,
} from '#/shared/utils/gemini-retry.util.js';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly genAI?: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('EMBEDDING_API_KEY');
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : undefined;
  }

  public async generateAnswer(
    question: string,
    chunks: KnowledgeChunk[],
    intent?: string,
  ): Promise<string> {
    this.logger.log(loggerMessages.generatingAnswer(intent));

    if (!this.genAI) {
      throw new Error(errorMessages.llmApiKeyMissing);
    }

    const contextText =
      chunks.length > 0
        ? chunks
            .map((chunk, index) => `[Source ${index + 1}]:\n${chunk.content}`)
            .join('\n\n')
        : 'NO_KNOWLEDGE_RETRIEVED';

    const systemInstruction = SYSTEM_PROMPT.generateAnswer.systemPrompt;

    const userPrompt = SYSTEM_PROMPT.generateAnswer.userPrompt(
      question,
      contextText,
      intent,
    );

    const primaryModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.5-flash';
    const fallbackModel = this.configService.get<string>('FALLBACK_MODEL');
    const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
    const maxAttempts = Math.max(2, models.length);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const modelName = models[attempt - 1] || primaryModel;
        const model = this.genAI.getGenerativeModel({
          model: modelName,
        });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstruction }],
          },
        });

        const answer = result.response.text().trim();
        if (!answer) {
          throw new Error(errorMessages.invalidLlmResponse);
        }

        return answer;
      } catch (error) {
        this.logger.warn(
          loggerMessages.generationAttemptFailed(
            attempt,
            models[attempt - 1] || primaryModel,
            error,
          ),
        );

        if (attempt === maxAttempts || !isRetryableGeminiError(error)) {
          throw error;
        }

        await waitBeforeGeminiRetry(attempt);
      }
    }

    throw new Error(errorMessages.llmGenerationFailed);
  }
}
