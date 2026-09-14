import { Injectable, Logger } from '@nestjs/common';
import { AnswerValidatorService } from '#/modules/validation/answer-validator/answer-validator.service.js';
import {
  AgentResultStatus,
  IntentEnum,
  SafetyStatus,
  ToolName,
  ToolCallExecutionStatus,
} from '#/shared/enums/domain.enums.js';
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_GENERATION_ATTEMPTS,
} from '#/shared/constants/domain.constants.js';
import { KnowledgeChunk } from '#/shared/interfaces/knowledgeChunk.js';
import { AgentResultSchema } from '#/shared/dto/agentResult.dto.js';
import { AgentResult } from '#/shared/types/dto.types.js';
import { PlannerService } from '#/modules/agent/planner/planner.service.js';
import { LlmService } from '#/modules/agent/llm/llm.service.js';
import { ValidationResult } from '#/shared/interfaces/validationResult.js';
import { ToolCallLog } from '#/shared/interfaces/toolCallLog.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
import { decisionSummaries } from '#/shared/constants/decisionSummary.constants.js';
import { loggerMessages } from '#/shared/constants/loggerMessage.js';
import { ToolsRegistry } from '#/modules/tools/registry/tools.registry.js';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    private readonly toolsRegistry: ToolsRegistry,
    private readonly answerValidatorService: AnswerValidatorService,
    private readonly plannerService: PlannerService,
    private readonly llmService: LlmService,
  ) {}

  public async execute(
    question: string,
    toolLogs: ToolCallLog[] = [],
  ): Promise<AgentResult> {
    this.logger.log(loggerMessages.workflowStarted(question));

    const inputValidation = this.toolsRegistry.execute(ToolName.VALIDATE_INPUT, question);
    if (!inputValidation.isValid) {
      return AgentResultSchema.parse({
        status: AgentResultStatus.ERROR,
        answer: inputValidation.reason || errorMessages.invalidInput,
        sources: [],
        confidence: 0,
        decisionSummary: decisionSummaries.inputValidationRejected,
      });
    }

    const safetyStatus = this.toolsRegistry.execute(ToolName.SAFETY_CHECK, question);

    if (safetyStatus === SafetyStatus.NEEDS_ESCALATION) {
      this.logger.warn(loggerMessages.safetyEscalation);
      return AgentResultSchema.parse({
        status: AgentResultStatus.SAFETY_ESCALATION,
        answer: errorMessages.safetyEscalation,
        sources: [],
        confidence: 1.0,
        decisionSummary: decisionSummaries.safetyEscalationBeforePlanning,
      });
    }

    if (safetyStatus === SafetyStatus.OUT_OF_SCOPE) {
      this.logger.log(loggerMessages.outOfScope);
      return AgentResultSchema.parse({
        status: AgentResultStatus.OUT_OF_SCOPE,
        answer: errorMessages.medicalAdviceNotSupported,
        sources: [],
        confidence: 1.0,
        decisionSummary: decisionSummaries.scopeGuardrailRejected,
      });
    }

    const plan = await this.plannerService.plan(question);

    if (plan.intent === IntentEnum.CLARIFICATION) {
      return AgentResultSchema.parse({
        status: AgentResultStatus.NEEDS_CLARIFICATION,
        answer: errorMessages.clarificationNeeded,
        sources: [],
        confidence: 0.8,
        intent: plan.intent,
        decisionSummary: decisionSummaries.clarificationWithoutRetrieval,
      });
    }

    if (plan.intent === IntentEnum.OUT_OF_SCOPE) {
      return AgentResultSchema.parse({
        status: AgentResultStatus.OUT_OF_SCOPE,
        answer: errorMessages.requestOutOfScope,
        sources: [],
        confidence: 1.0,
        intent: plan.intent,
        decisionSummary: decisionSummaries.plannerOutOfScope,
      });
    }

    let retrievedChunks: KnowledgeChunk[] = [];
    if (plan.needsKnowledgeSearch) {
      const toolStartTime = Date.now();
      const retrievalQuery = plan.retrievalQuery || question;
      try {
        const searchResults = await this.toolsRegistry.execute(
          ToolName.SEARCH_KNOWLEDGE_BASE,
          { query: retrievalQuery, limit: DEFAULT_SEARCH_LIMIT },
        );
        const toolDuration = Date.now() - toolStartTime;

        retrievedChunks = searchResults.map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.distance ? 1 - chunk.distance : undefined,
        }));

        toolLogs.push({
          toolName: ToolName.SEARCH_KNOWLEDGE_BASE,
          input: { query: retrievalQuery, limit: DEFAULT_SEARCH_LIMIT },
          output: { chunksFound: searchResults.length },
          status: ToolCallExecutionStatus.SUCCESS,
          durationMs: toolDuration,
        });
      } catch (error) {
        const toolDuration = Date.now() - toolStartTime;
        
        toolLogs.push({
          toolName: ToolName.SEARCH_KNOWLEDGE_BASE,
          input: { query: retrievalQuery, limit: DEFAULT_SEARCH_LIMIT },
          output: error instanceof Error ? error.message : errorMessages.unknownError,
          status: ToolCallExecutionStatus.ERROR,
          durationMs: toolDuration,
        });
        
        this.logger.error(loggerMessages.searchToolFailed, error);
        throw error;
      }
    }

    const maxAttempts = MAX_GENERATION_ATTEMPTS;
    let draftAnswer = '';
    let validationResult: ValidationResult = { valid: false, grounded: false, issues: [] };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.logger.log(loggerMessages.generationAttempt(attempt, maxAttempts));

      draftAnswer = await this.llmService.generateAnswer(
        question,
        retrievedChunks,
        plan.intent,
      );

      validationResult = this.answerValidatorService.validateAnswer(
        draftAnswer,
        retrievedChunks.length,
        plan.intent,
      );

      if (validationResult.valid) {
        this.logger.log(loggerMessages.answerPassedValidation(attempt));
        return AgentResultSchema.parse({
          status: ToolCallExecutionStatus.SUCCESS,
          answer: draftAnswer,
          sources: retrievedChunks,
          confidence: 0.95,
          intent: plan.intent,
          decisionSummary: decisionSummaries.answerValidationPassed(retrievedChunks.length),
        });
      }

      this.logger.warn(loggerMessages.validationFailed(attempt, validationResult.issues));
    }

    this.logger.error(loggerMessages.allGenerationAttemptsFailed);
    return AgentResultSchema.parse({
      status: AgentResultStatus.SUCCESS,
      answer:
        plan.intent === IntentEnum.THOUGHT_EXPLORATION
          ? errorMessages.supportiveFallback
          : errorMessages.noRelevantInformation,
      sources: retrievedChunks,
      confidence: 0.4,
      intent: plan.intent,
      decisionSummary: decisionSummaries.safeFallback,
    });
  }
}