import { Injectable, Logger } from '@nestjs/common';
import { AnswerValidatorService } from '#/modules/validation/answer-validator/answer-validator.service.js';
import { KnowledgeChunk } from '#/shared/types/agent.types.js';
import { AgentResult, AgentResultSchema } from '#/shared/dto/agentResult.dto.js';
import { PlannerService } from '#/modules/agent/planner/planner.service.js';
import { LlmService } from '#/modules/agent/llm/llm.service.js';
import { ValidationResult } from '#/shared/interfaces/validationResult.js';
import { ToolCallLog } from '#/shared/types/agent.types.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';
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

    const inputValidation = this.toolsRegistry.execute('validate_input', question);
    if (!inputValidation.isValid) {
      return AgentResultSchema.parse({
        status: 'error',
        answer: inputValidation.reason || errorMessages.invalidInput,
        sources: [],
        confidence: 0,
        decisionSummary: 'Input validation rejected the question.',
      });
    }

    const safetyStatus = this.toolsRegistry.execute('safety_check', question);

    if (safetyStatus === 'needs_escalation') {
      this.logger.warn(loggerMessages.safetyEscalation);
      return AgentResultSchema.parse({
        status: 'safety_escalation',
        answer: errorMessages.safetyEscalation,
        sources: [],
        confidence: 1.0,
        decisionSummary: 'Crisis language triggered safety escalation before planning.',
      });
    }

    if (safetyStatus === 'out_of_scope') {
      this.logger.log(loggerMessages.outOfScope);
      return AgentResultSchema.parse({
        status: 'out_of_scope',
        answer: errorMessages.medicalAdviceNotSupported,
        sources: [],
        confidence: 1.0,
        decisionSummary: 'A deterministic scope guardrail rejected the request before planning.',
      });
    }

    const plan = await this.plannerService.plan(question);

    if (plan.intent === 'clarification') {
      return AgentResultSchema.parse({
        status: 'needs_clarification',
        answer: errorMessages.clarificationNeeded,
        sources: [],
        confidence: 0.8,
        intent: plan.intent,
        decisionSummary: 'Planner classified the request as clarification and no retrieval was needed.',
      });
    }

    if (plan.intent === 'out_of_scope') {
      return AgentResultSchema.parse({
        status: 'out_of_scope',
        answer: errorMessages.requestOutOfScope,
        sources: [],
        confidence: 1.0,
        intent: plan.intent,
        decisionSummary: 'Planner classified the request as out of scope.',
      });
    }

    let retrievedChunks: KnowledgeChunk[] = [];
    if (plan.needsKnowledgeSearch) {
      const toolStartTime = Date.now();
      const retrievalQuery = plan.retrievalQuery || question;
      try {
        const searchResults = await this.toolsRegistry.execute(
          'search_knowledge_base',
          { query: retrievalQuery, limit: 3 },
        );
        const toolDuration = Date.now() - toolStartTime;

        retrievedChunks = searchResults.map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          similarity: chunk.distance ? 1 - chunk.distance : undefined,
        }));

        toolLogs.push({
          toolName: 'search_knowledge_base',
          input: { query: retrievalQuery, limit: 3 },
          output: { chunksFound: searchResults.length },
          status: 'success',
          durationMs: toolDuration,
        });
      } catch (error) {
        const toolDuration = Date.now() - toolStartTime;
        
        toolLogs.push({
          toolName: 'search_knowledge_base',
          input: { query: retrievalQuery, limit: 3 },
          output: error instanceof Error ? error.message : errorMessages.unknownError,
          status: 'error',
          durationMs: toolDuration,
        });
        
        this.logger.error(loggerMessages.searchToolFailed, error);
        throw error;
      }
    }

    const maxAttempts = 2;
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
          status: 'success',
          answer: draftAnswer,
          sources: retrievedChunks,
          confidence: 0.95,
          intent: plan.intent,
          decisionSummary: `Planner selected ${retrievedChunks.length} knowledge sources and answer validation passed.`,
        });
      }

      this.logger.warn(loggerMessages.validationFailed(attempt, validationResult.issues));
    }

    this.logger.error(loggerMessages.allGenerationAttemptsFailed);
    return AgentResultSchema.parse({
      status: 'success',
      answer:
        plan.intent === 'thought_exploration'
          ? errorMessages.supportiveFallback
          : errorMessages.noRelevantInformation,
      sources: retrievedChunks,
      confidence: 0.4,
      intent: plan.intent,
      decisionSummary: 'Generation completed, but all answer validation attempts failed; returned a safe fallback.',
    });
  }
}