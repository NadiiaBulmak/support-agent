import { Module } from '@nestjs/common';
import { AnswerValidatorService } from '#/modules/validation/answer-validator/answer-validator.service.js';

@Module({
  providers: [AnswerValidatorService],
  exports: [AnswerValidatorService],
})
export class ValidationModule {}
