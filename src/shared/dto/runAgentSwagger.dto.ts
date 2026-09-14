import { ApiProperty } from "@nestjs/swagger";
import { MAX_INPUT_LENGTH } from "../constants/validation.constants.js";

export class RunAgentSwaggerDto {
  @ApiProperty({
    description: 'User question for the support agent',
    example: 'What is cognitive restructuring?',
    minLength: 1,
    maxLength: MAX_INPUT_LENGTH,
  })
  question!: string;
}