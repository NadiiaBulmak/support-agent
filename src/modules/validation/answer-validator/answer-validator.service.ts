import { Injectable, Logger } from '@nestjs/common';
import { ValidationResult } from '#/shared/interfaces/validationResult.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import { ANSWER_MEDICAL_KEYWORDS } from '#/shared/constants/policy.constants.js';
import { IntentEnum } from '#/shared/enums/domain.enums.js';

@Injectable()
export class AnswerValidatorService {
  private readonly logger = new Logger(AnswerValidatorService.name);

  public validateAnswer(
    answer: string,
    retrievedChunksCount: number,
    intent?: IntentEnum,
  ): ValidationResult {
    const issues: string[] = [];

    if (!answer || answer.trim().length === 0) {
      issues.push('Answer is empty.');
    }

    const lowerAnswer = answer.toLowerCase();
    
    for (const keyword of ANSWER_MEDICAL_KEYWORDS) {
      if (lowerAnswer.includes(keyword)) {
        issues.push(`Answer contains medical/clinical boundary violation: "${keyword}".`);
      }
    }

    const grounded = retrievedChunksCount > 0;
    const canUseUserContext = intent === IntentEnum.THOUGHT_EXPLORATION;
    if (
      !grounded &&
      !canUseUserContext &&
      !lowerAnswer.includes('no relevant information')
    ) {
      issues.push('Answer is ungrounded: no chunks were retrieved from knowledge base.');
    }

    const valid = issues.length === 0;

    this.logger.log(loggerMessages.validationComplete(valid, grounded));

    return {
      valid,
      grounded,
      issues,
    };
  }
}