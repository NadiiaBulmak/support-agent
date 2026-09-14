import { z } from 'zod';
import { MAX_INPUT_LENGTH } from '#/shared/constants/index.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';

export const RunAgentDtoSchema = z.object({
  question: z
    .string()
    .min(1, errorMessages.questionEmpty)
    .max(MAX_INPUT_LENGTH, errorMessages.questionTooLong(MAX_INPUT_LENGTH)),
});
