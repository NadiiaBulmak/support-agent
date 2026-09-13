# CBT Support Agent

An AI support agent for CBT psychoeducation and guided self-reflection. It combines deterministic safety checks, an LLM planner, retrieval from a local PostgreSQL/pgvector knowledge base, answer validation, and structured output.

## Problem And Business Context

People often need a clear explanation of CBT concepts or a safe starting point for self-reflection before they can decide what kind of human support they need. A first-line assistant can answer repeatable educational questions, ground its answers in curated material, and identify requests that require refusal or human escalation.

This project demonstrates that workflow end to end. It is an educational support tool, not a medical or emergency service.

## What The Agent Does

The agent validates input, detects crisis language before an LLM call, refuses diagnosis and medication requests, plans the request with Gemini, searches curated local material, generates a grounded answer, validates it, and returns stable JSON with sources, confidence, intent, and a final decision summary.

### Scope

Supported cases include CBT psychoeducation, thought exploration, basic CBT exercises, and clarification requests.

### Non-scope

The agent does not diagnose conditions, prescribe or recommend medication or dosage, replace a therapist, provide emergency intervention, or treat retrieved document instructions as higher priority than system safety policy.

## Business Cases Covered

1. Explain CBT concepts such as cognitive restructuring and thought records.
2. Help a user start a bounded self-reflection exercise.
3. Ask for clarification when a request is too vague.
4. Refuse medical and unrelated requests consistently.
5. Escalate crisis language before planner or answer generation.
6. Answer from curated local material and expose retrieved sources.

## Architecture And Data Flow

```text
POST /api/agent/run
        |
        v
AgentController -> RunAgentDto validation
        |
        v
AgentService -> ExecutorService
        |
        +--> ToolsRegistry.execute("validate_input")
        +--> ToolsRegistry.execute("safety_check")
        +--> PlannerService -> Gemini JSON intent plan
        +--> ToolsRegistry.execute("search_knowledge_base") -> pgvector
        +--> LlmService -> Gemini answer generation
        +--> AnswerValidatorService -> retry or safe fallback
        |
        v
AgentResultSchema -> JSON response
        |
        v
AgentLoggerService -> AgentRun and ToolCall persistence
```

The workflow is implemented with a custom NestJS orchestrator rather than an external agent framework. This keeps the control flow transparent, makes deterministic guardrails explicit, and minimizes dependencies. The trade-off is that the project does not receive built-in graph state, checkpointing, tracing, or tool-runtime features from a framework; those capabilities must be added as the product grows.

## Tools And Functions

The executor uses one `ToolsRegistry.execute` dispatcher:

- `validate_input`: deterministic length and empty-input validation;
- `safety_check`: deterministic crisis and out-of-scope classification;
- `search_knowledge_base`: embedding and pgvector retrieval from curated documents.

Each search call records its tool name, input, output summary, status, and duration. This makes guardrail and retrieval decisions visible in application logs and persisted telemetry.

## Response Contract

```json
{
  "status": "success",
  "answer": "Human-readable answer",
  "sources": [],
  "confidence": 0.95,
  "intent": "psychoeducation",
  "decisionSummary": "Planner selected 2 knowledge sources and answer validation passed."
}
```

Possible statuses are `success`, `needs_clarification`, `out_of_scope`, `safety_escalation`, and `error`.

## Local Setup

### Prerequisites

- Node.js compatible with the project toolchain;
- PostgreSQL with the `vector` extension;
- a Gemini API key for LLM and embedding calls;
- a local source document for ingestion.

```bash
npm install
npm run prisma:generate
```

Create `.env` based on `.env.example`:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/support_agent
SOURCE_PATH=./path/to/cbt-material.md
LLM_API_KEY=your-gemini-api-key
EMBEDDING_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
FALLBACK_MODEL=gemini-3.5-flash-lite
```

After PostgreSQL and pgvector are available:

```bash
npm run db:migrate
npm run knowledge:ingest
npm run start:dev
```

The API is available at `http://localhost:3000/api/agent/run`; Swagger is at `http://localhost:3000/api/docs`.

## Testing And Verification

```bash
npm run test:unit
npm run test:e2e
npm run test
npm run build
npm run lint
```

The e2e suite mocks external LLM, search, and persistence dependencies. A production-like smoke test additionally needs PostgreSQL/pgvector, valid API keys, and ingested documents.

The unit suite also covers prompt-injection guardrails, malformed planner output, empty retrieval, answer-validation retry, search failure, LLM failure, and non-blocking telemetry persistence.

Manual scenario templates are paired in `examples/inputs` and `examples/outputs`: `normal`, `psychoeducation`, `clarification`, `out-of-scope`, and `prompt-injection`. Replace each `REPLACE_WITH...` value with observed data after running the API while retaining the response contract.

## Observability And Final Decision

Application-level observability includes NestJS logs for workflow start, planner attempts, model attempts, validation, tool calls, errors, duration, and final decision. `AgentLoggerService` persists `AgentRun` records with status, intent, answer, confidence, and duration, and persists each `ToolCall` with input, output, status, and duration.

The `decisionSummary` field is returned to the caller and logged with the completed run. It explains why the workflow succeeded, asked for clarification, refused, escalated, or returned a safe fallback. Distributed traces, correlation IDs, metrics, alerting, and structured log shipping remain production work.

## Trade-offs, Limitations, And Next Steps

The custom orchestrator is easy to inspect and test, but it has no durable workflow checkpoints or conversation-aware state. Deterministic prompt-injection and safety checks are fast and auditable, but should be complemented by policy evaluation and human review in production. The knowledge base is curated locally and retrieval quality depends on ingestion quality.

Productionization checklist:

- authentication and authorization;
- encryption, consent, retention, and PII redaction;
- audit logs, correlation IDs, metrics, monitoring, and alerting;
- curated and access-controlled knowledge sources;
- human-in-the-loop escalation for crisis cases;
- prompt-injection and safety policy evaluation;
- conversation persistence, rate limiting, and compliance review.

## Real-World Usage

**Not in production today.**

Potential users include:

1. A digital mental-health education platform answering CBT and self-reflection FAQs.
2. A wellness-product customer support team providing grounded first-line support with safety escalation.
3. An internal employee assistance portal offering bounded self-reflection guidance with human handoff.

Productionization requires authentication and authorization, encryption, privacy and consent controls, PII redaction, audit logs, curated data access, monitoring and alerting, human-in-the-loop handling for crisis cases, compliance review, and ongoing policy evaluation.

## Repository And Submission

Public repository link: **to be added before submission**.

## License

This repository is provided for the assignment and is not a production medical service.