import { Injectable, Logger } from '@nestjs/common';
import { InputValidationResult } from '#/shared/interfaces/inputValidationResult.js';
import { MAX_INPUT_LENGTH } from '#/shared/constants/index.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';

@Injectable()
export class ValidateInputService {
  private readonly logger = new Logger(ValidateInputService.name);
  private readonly maxLength = MAX_INPUT_LENGTH;

  public validate(input: string): InputValidationResult {
    if (!input || input.trim().length === 0) {
      this.logger.warn(loggerMessages.validationEmptyInput);
      return {
        isValid: false,
        reason: errorMessages.questionEmpty,
      };
    }

    if (input.length > this.maxLength) {
      this.logger.warn(loggerMessages.validationInputTooLong(input.length, this.maxLength));
      return {
        isValid: false,
        reason: errorMessages.questionTooLong(this.maxLength),
      };
    }

    return { isValid: true };
  }
}