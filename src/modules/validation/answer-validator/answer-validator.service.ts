import { Injectable, Logger } from '@nestjs/common';
import { ValidationResult } from '#/shared/interfaces/validationResult.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class AnswerValidatorService {
  private readonly logger = new Logger(AnswerValidatorService.name);

  public validateAnswer(
    answer: string,
    retrievedChunksCount: number,
    intent?: string,
  ): ValidationResult {
    const issues: string[] = [];

    if (!answer || answer.trim().length === 0) {
      issues.push('Answer is empty.');
    }

    const medicalKeywords = ['diagnose', 'prescription', 'medication', 'take this drug', 'treatment plan', 'surgery', 'injection', 'vaccine', 'therapy', 'clinical trial'];
    const lowerAnswer = answer.toLowerCase();
    
    for (const keyword of medicalKeywords) {
      if (lowerAnswer.includes(keyword)) {
        issues.push(`Answer contains medical/clinical boundary violation: "${keyword}".`);
      }
    }

    const grounded = retrievedChunksCount > 0;
    const canUseUserContext = intent === 'thought_exploration';
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