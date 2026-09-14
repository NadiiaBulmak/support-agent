import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  PlannerOutputSchema,
} from '#/shared/dto/plannerOutput.dto.js';
import { PlannerOutput } from '#/shared/types/dto.types.js';
import {
  DEFAULT_GENERATION_MODEL,
} from '#/shared/constants/domain.constants.js';
import { EnvironmentVariables, IntentEnum } from '#/shared/enums/domain.enums.js';
import { SYSTEM_PROMPT } from '#/shared/constants/systemPrompts.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import {
  isRetryableGeminiError,
  waitBeforeGeminiRetry,
} from '#/shared/utils/gemini-retry.util.js';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  private readonly genAI?: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(EnvironmentVariables.API_KEY);
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : undefined;
  }

  public async plan(question: string): Promise<PlannerOutput> {
    this.logger.log(loggerMessages.planning(question));

    if (!this.genAI) {
      this.logger.error(errorMessages.llmApiKeyMissing);
      return {
        intent: IntentEnum.THOUGHT_EXPLORATION,
        needsKnowledgeSearch: true,
      };
    }

    const primaryModel =
      this.configService.get<string>(EnvironmentVariables.GENERATION_MODEL) || DEFAULT_GENERATION_MODEL;
    const fallbackModel = this.configService.get<string>(EnvironmentVariables.FALLBACK_MODEL);
    const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
    const maxAttempts = Math.max(2, models.length);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const modelName = models[attempt - 1] || primaryModel;
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = SYSTEM_PROMPT.plannerResponse(question);

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        const rawJson = JSON.parse(textResponse);
        const validatedOutput = PlannerOutputSchema.parse(rawJson);

        this.logger.log(
          loggerMessages.plannerOutput(
            attempt,
            validatedOutput.intent,
            validatedOutput.needsKnowledgeSearch,
          ),
        );

        return validatedOutput;
      } catch (error) {
        this.logger.warn(
          loggerMessages.plannerAttemptFailed(
            attempt,
            models[attempt - 1] || primaryModel,
            error,
          ),
        );

        if (attempt === maxAttempts || !isRetryableGeminiError(error)) {
          this.logger.error(loggerMessages.plannerFallback);
          return {
            intent: IntentEnum.THOUGHT_EXPLORATION,
            needsKnowledgeSearch: true,
          };
        }

        await waitBeforeGeminiRetry(attempt);
      }
    }

    return {
      intent: IntentEnum.THOUGHT_EXPLORATION,
      needsKnowledgeSearch: true,
    };
  }
}
