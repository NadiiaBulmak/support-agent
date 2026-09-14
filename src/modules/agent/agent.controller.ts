import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AgentService } from '#/modules/agent/agent.service.js';
import { RunAgentDtoSchema } from '#/shared/dto/runAgent.dto.js';
import { AgentResultStatus, IntentEnum } from '#/shared/enums/domain.enums.js';
import { AgentResult } from '#/shared/types/dto.types.js';
import { MAX_INPUT_LENGTH } from '#/shared/constants/index.js';

class RunAgentSwaggerDto {
  @ApiProperty({
    description: 'User question for the support agent',
    example: 'What is cognitive restructuring?',
    minLength: 1,
    maxLength: MAX_INPUT_LENGTH,
  })
  question!: string;
}

@ApiTags('Agent')
@Controller('api/agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run the support agent',
    description:
      'Processes a user question and returns an answer with sources, confidence, and intent.',
  })
  @ApiBody({ type: RunAgentSwaggerDto })
  @ApiOkResponse({
    description: 'Agent result',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(AgentResultStatus),
          example: AgentResultStatus.SUCCESS,
        },
        answer: { type: 'string', example: 'Cognitive restructuring...' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'chunk-123' },
              content: { type: 'string', example: 'Cognitive restructuring...' },
              documentTitle: { type: 'string', example: 'CBT Basics' },
              section: { type: 'string', example: 'Core techniques' },
              similarity: { type: 'number', example: 0.92 },
            },
            required: ['id', 'content'],
          },
        },
        confidence: { type: 'number', example: 0.92 },
        decisionSummary: {
          type: 'string',
          example: 'Planner selected 2 knowledge sources and answer validation passed.',
        },
        intent: {
          type: 'string',
          enum: Object.values(IntentEnum),
          example: IntentEnum.PSYCHOEDUCATION,
        },
      },
      required: ['status', 'answer', 'sources', 'confidence', 'decisionSummary'],
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body. The question must be 1-1000 characters.',
  })
  public async run(@Body() body: unknown): Promise<AgentResult> {
    const parseResult = RunAgentDtoSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues
        .map((issue) => issue.message)
        .join(', ');
      throw new BadRequestException(errorMessage);
    }

    return await this.agentService.run(parseResult.data.question);
  }
}