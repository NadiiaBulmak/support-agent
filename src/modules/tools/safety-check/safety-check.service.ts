import { Injectable, Logger } from '@nestjs/common';
import {
  PROMPT_INJECTION_PATTERNS,
  SAFETY_CRISIS_KEYWORDS,
  SAFETY_OUT_OF_SCOPE_KEYWORDS,
} from '#/shared/constants/policy.constants.js';
import { SafetyStatus } from '#/shared/enums/domain.enums.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class SafetyCheckService {
  private readonly logger = new Logger(SafetyCheckService.name);

  public check(question: string): SafetyStatus {
    const lowerQuestion = question.toLowerCase();

    for (const keyword of SAFETY_CRISIS_KEYWORDS) {
      if (lowerQuestion.includes(keyword)) {
        this.logger.warn(loggerMessages.safetyKeyword(keyword));
        return SafetyStatus.NEEDS_ESCALATION;
      }
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (lowerQuestion.includes(pattern)) {
        this.logger.log(loggerMessages.outOfScopeKeyword(pattern));
        return SafetyStatus.OUT_OF_SCOPE;
      }
    }

    for (const keyword of SAFETY_OUT_OF_SCOPE_KEYWORDS) {
      if (lowerQuestion.includes(keyword)) {
        this.logger.log(loggerMessages.outOfScopeKeyword(keyword));
        return SafetyStatus.OUT_OF_SCOPE;
      }
    }

    return SafetyStatus.SAFE;
  }
}