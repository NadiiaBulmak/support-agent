# CBT Support Agent

An AI support agent for CBT psychoeducation and guided self-reflection. It combines deterministic safety checks, an LLM planner, retrieval from a local PostgreSQL/pgvector knowledge base, answer validation, and structured output.

## Problem And Business Context

People often need a clear explanation of CBT concepts or a safe starting point for self-reflection before they can decide what kind of human support they need. A first-line assistant can answer repeatable educational questions, ground its answers in curated material, and identify requests that require refusal or human escalation.

The business value is deliberately bounded: automate repetitive low-risk CBT psychoeducation questions, provide grounded first-line support, and route medical, unsafe, and crisis scenarios away from automatic handling. This project demonstrates that workflow end to end. It is an educational support tool, not an autonomous mental-health or medical assistant and not an emergency service.

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

## What The Assignment Demonstrates

This project demonstrates a complete, tool-using AI agent workflow rather than a single prompt sent directly to an LLM:

| Requirement | Project implementation |
| --- | --- |
| Multi-step agent | `PlannerService` analyzes the request and returns a structured plan containing the intent, whether knowledge retrieval is needed, and an optional retrieval query. `ExecutorService` coordinates validation, safety checks, retrieval, generation, and answer validation. |
| At least two tools/functions | `validate_input`, `safety_check`, and `search_knowledge_base` are registered and dispatched through `ToolsRegistry`. |
| Structured JSON output | `AgentResultSchema` validates `status`, `answer`, `sources`, `confidence`, `intent`, and `decisionSummary`. |
| Human-readable response | The `answer` field contains the final explanation or safe refusal intended for the user. |
| Retrieval-augmented generation | The question is embedded and matched against PostgreSQL/pgvector chunks from the curated knowledge base. The full knowledge base is not sent to the LLM. |
| Guardrails | Input validation, deterministic crisis and medical checks, prompt-injection refusal, grounding validation, and clinical boundaries run before or around generation. |
| Reliability | Planner and generation retries, answer-validation retries, deterministic fallback plans, safe fallback answers, and error results prevent uncontrolled failure loops. |
| Observability | NestJS logs plus persisted `AgentRun` and `ToolCall` records capture decisions, statuses, inputs/outputs, durations, and final summaries. |
| Testing | Vitest unit tests cover tools and failure paths; Supertest e2e tests cover the HTTP workflow with external services mocked. |
| Business case | The agent provides bounded CBT psychoeducation and guided self-reflection while explicitly refusing diagnosis, medication advice, and emergency treatment. |

The implementation uses a custom NestJS orchestrator. This choice demonstrates explicit control over safety ordering, tool execution, retries, and validation while keeping the system easy to test and extend. It is a multi-step tool-using workflow, not a single prompt sent directly to Gemini.

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

The executor uses one `ToolsRegistry.execute` dispatcher for exactly three registered tools/functions:

- `validate_input`: deterministic empty-input and maximum-length validation;
- `safety_check`: deterministic crisis, prompt-injection, medical, and out-of-scope classification;
- `search_knowledge_base`: retrieval capability that embeds a query and searches curated PostgreSQL/pgvector chunks.

The first two are deterministic control and guardrail tools. The third gives the workflow access to an external knowledge source; it does not itself generate an answer or replace the planner/generation steps.

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

`confidence` is an application-level estimate selected by the workflow for its outcome (for example, `0.95` after answer validation, `0.8` for clarification, and `1.0` for deterministic refusals). It is not a calibrated probability.

## Local Setup

The application is a NestJS API. PostgreSQL with pgvector runs separately through Docker Compose.

### Prerequisites

- Node.js 22 or a compatible Node.js release;
- npm;
- Docker Desktop with Docker Compose;
- a Gemini API key;
- a legally redistributable CBT source file for ingestion.

### 1. Install dependencies

Clone the repository and install dependencies:

```bash
npm install
```

The repository already contains the generated Prisma Client, so running `prisma generate` is not required for the standard setup. If the Prisma schema or generated client is changed during development, regenerate it with:

```bash
npm run prisma:generate
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Configure the required values:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/support_agent?schema=public
SOURCE_PATH=src/modules/knowledge/sources
FILE_NAME=cbt-material.md
LLM_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
FALLBACK_MODEL=gemini-3.5-flash-lite
PORT=3000
```

`DATABASE_URL` selects the PostgreSQL database.

`SOURCE_PATH` is the directory containing the knowledge source file.

`FILE_NAME` specifies the file used during knowledge-base ingestion.

`LLM_API_KEY` is required for planner, answer-generation, and embedding requests.

Never commit `.env` or expose API keys in the repository.

### 3. Start PostgreSQL and pgvector

The included `docker-compose.yml` provides the PostgreSQL database with the `vector` extension.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Check that the container is running:

```bash
docker compose ps
```

The local database uses:

```text
Database: support_agent
User: postgres
Password: postgres
Host: localhost
Port: 5435
```

The corresponding connection string is:

```text
postgresql://postgres:postgres@localhost:5435/support_agent?schema=public
```

Stop the database when finished:

```bash
docker compose down
```

To remove the database volume and recreate the database from scratch:

```bash
docker compose down -v
```

This permanently deletes the local PostgreSQL data.

### 4. Apply the database schema

With PostgreSQL running and `.env` configured:

```bash
npm run db:migrate -- --name init
```

Check the migration state:

```bash
npm run db:status
```

For local development, `db:migrate` applies the Prisma migrations and creates a new migration when the schema changes.

For an existing deployment, use:

```bash
npm run db:deploy
```

to apply committed migrations without creating new ones.

The database schema includes the tables required for:

- knowledge documents and chunks;
- agent runs;
- tool calls;
- conversations;
- messages.

### 5. Inspect the database with Prisma Studio

After the database schema has been applied, check the database state:

```bash
npm run db:status
```

Then open Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio can be used to inspect the database tables and verify that migrations and later knowledge-base ingestion have created the expected records.

### 6. Add the knowledge source

Create or replace:

```text
src/modules/knowledge/sources/cbt-material.md
```

Place only CBT material that you are legally allowed to use and redistribute. The repository may contain a checked-in source fixture; verify its license before redistributing it, or replace it with an approved source.

The ingestion process reads the file specified by:

```dotenv
SOURCE_PATH=src/modules/knowledge/sources
FILE_NAME=cbt-material.md
```

### 7. Ingest the knowledge base

After the database schema is ready and the knowledge source has been added, run:

```bash
npm run knowledge:ingest
```

The ingestion process:

1. reads the configured source file;
2. cleans and splits the content into chunks;
3. creates embeddings;
4. stores the document and chunks in PostgreSQL/pgvector.

A successful ingestion creates records in:

```text
documents
document_chunks
```

Run ingestion again when the source material changes. You can optionally verify retrieval with:

```bash
npm run knowledge:search
```

### 8. Start the API

Start the NestJS application in development mode:

```bash
npm run start:dev
```

The API is available at:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api/docs
```

The main endpoint is:

```text
POST /api/agent/run
```

### 9. Test the API with Swagger

Open:

```text
http://localhost:3000/api/docs
```

In Swagger UI:

1. Expand `POST /api/agent/run`.
2. Click **Try it out**.
3. Enter a request body:

```json
{
  "question": "What is cognitive restructuring in CBT?"
}
```

4. Click **Execute**.
5. Review the structured response.

A successful response contains fields such as:

```json
{
  "status": "success",
  "answer": "Human-readable answer",
  "sources": [],
  "confidence": 0.95,
  "intent": "psychoeducation",
  "decisionSummary": "..."
}
```

For a RAG request with populated sources, PostgreSQL/pgvector must be running and the knowledge base must have been ingested successfully.

### 10. Quick API test

The endpoint can also be tested directly from PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/api/agent/run `
  -ContentType 'application/json' `
  -Body '{"question":"What is catastrophizing in CBT?"}'
```

The response should contain the structured agent result.

### Standard startup flow

For a clean local run, the required order is:

```text
npm install
        |
configure .env
        |
docker compose up -d postgres
        |
npm run db:migrate -- --name init
        |
npm run db:status
        |
npx prisma studio (optional)
        |
add knowledge source
        |
npm run knowledge:ingest
        |
npm run start:dev
        |
Swagger / API request
```

The API is intentionally started directly with NestJS rather than as a Docker container. Docker Compose is used for the PostgreSQL/pgvector dependency.

## Testing And Verification

Run the focused checks in this order:

```bash
npm run prisma:validate
npm run test:unit
npm run test:e2e
npm run build
npm run lint
```

Or run the standard test command:

```bash
npm run test
```

The tests have different purposes:

- `npm run test:unit` checks individual services and boundaries: input validation, crisis and out-of-scope detection, prompt-injection blocking, planner schema validation, retrieval results, answer grounding, retries, fallback behavior, LLM/search failures, and non-blocking telemetry persistence. It does not require PostgreSQL or live API keys.
- `npm run test:e2e` exercises an HTTP-level end-to-end workflow with external LLM, retrieval, and persistence dependencies mocked. It checks the HTTP controller, DTO validation, agent orchestration, tool dispatching, safety handling, and response contract; it is not a production-like live Gemini/PostgreSQL integration test.
- `npm run test` runs both unit and e2e suites.
- `npm run build` verifies TypeScript compilation and the production `dist` output used by the scripts and API startup.
- `npm run lint` checks source and test code with Oxlint.
- `npm run prisma:validate` checks the Prisma schema and configuration.

The repository also includes manual scenarios in `examples/inputs` and `examples/outputs`. The files contain recorded outputs rather than `REPLACE_WITH...` placeholders. The examples are summarized below.

## Example Inputs And Outputs

These are excerpts from the checked-in JSON files. Long source contents are shortened here; the linked files contain the full values.

### Normal thought exploration

- Input: [`examples/inputs/normal.json`](examples/inputs/normal.json) asks: “I keep thinking that people secretly dislike me even when they haven't done anything wrong.”
- Output: [`examples/outputs/normal.json`](examples/outputs/normal.json) returns `status: "success"`, `intent: "thought_exploration"`, retrieved sources, and an answer that asks about observable evidence for and against the thought.
- Demonstrates: grounded self-reflection rather than diagnosis or certainty about other people's thoughts.

### CBT psychoeducation

- Input: [`examples/inputs/psychoeducation.json`](examples/inputs/psychoeducation.json) contains two questions about automatic thoughts and step-by-step thought records.
- Output: [`examples/outputs/psychoeducation.json`](examples/outputs/psychoeducation.json) contains two corresponding successful responses with retrieved sources and `intent: "psychoeducation"`.
- Demonstrates: knowledge-base-grounded explanations and exercise guidance.

### Clarification

- Input: [`examples/inputs/clarification.json`](examples/inputs/clarification.json): `"I don't know what to do."`
- Output: [`examples/outputs/clarification.json`](examples/outputs/clarification.json) returns `status: "needs_clarification"`, an empty `sources` array, and `confidence: 0.8`.
- Demonstrates: asking for context instead of guessing.

### Out-of-scope medical request

- Input: [`examples/inputs/out-of-scope.json`](examples/inputs/out-of-scope.json): `"Can you diagnose me with anxiety?"`
- Output: [`examples/outputs/out-of-scope.json`](examples/outputs/out-of-scope.json) returns `status: "out_of_scope"` and refuses diagnosis or medication advice.
- Demonstrates: deterministic clinical boundary handling.

### Prompt-injection fixture

- Input: [`examples/inputs/prompt-injection.json`](examples/inputs/prompt-injection.json) asks for an anxiety answer and internal reasoning step by step.
- Output: [`examples/outputs/prompt-injection.json`](examples/outputs/prompt-injection.json) records `status: "success"` with `"No relevant information found in the knowledge base for your query."` and sources. This is the recorded fixture output, not a claim that every live model call will produce the same text.
- Demonstrates: the checked-in behavior snapshot and why prompt-injection behavior should also be verified with the current deterministic safety tests.

There is no separate safety-escalation JSON file in `examples`. The HTTP e2e test covers that path with `"I want to kill myself"` and asserts `status: "safety_escalation"`; see [`test/agent.e2e-spec.ts`](test/agent.e2e-spec.ts). A live RAG smoke test additionally needs PostgreSQL/pgvector, valid API keys, completed migrations, and completed ingestion.

## Observability And Final Decision

Application-level observability includes NestJS logs for workflow start, planner attempts, model attempts, validation, tool calls, errors, duration, and final decision. `AgentLoggerService` persists `AgentRun` records with status, intent, answer, confidence, and duration, and persists each `ToolCall` with input, output, status, and duration.

The `decisionSummary` field is returned to the caller and logged with the completed run. It explains why the workflow succeeded, asked for clarification, refused, escalated, or returned a safe fallback. Distributed traces, correlation IDs, metrics, alerting, and structured log shipping remain production work.

## Trade-offs And Limitations

The custom orchestrator is easy to inspect and test, but it has no durable workflow checkpoints or conversation-aware state. Deterministic prompt-injection and safety checks are fast and auditable, but should be complemented by policy evaluation and human review in production. The knowledge base is curated locally and retrieval quality depends on ingestion quality.

Productionization checklist:

- authentication and authorization;
- encryption, consent, retention, and PII redaction;
- audit logs, correlation IDs, metrics, monitoring, and alerting;
- curated and access-controlled knowledge sources;
- human-in-the-loop escalation for crisis cases;
- prompt-injection and safety policy evaluation;
- conversation persistence, rate limiting, and compliance review.

## Next Steps And Product Evolution

The following is planned/future architecture, not the currently implemented system. The current deliverable is the NestJS API and custom agent workflow described above; this roadmap shows how a small team could evolve the MVP into a production-oriented product.

### Planned Architecture

```text
                                        Angular client
                                                |
                                        HTTP initially
                                                |
                                                v
                                        NestJS API
                                                |
           +---------------------+---------------------+
           v                     v                     v
         Auth              Conversations             Agent
           |                     |                     |
         Users                 Messages            Planner/tools
                                                                                  |
                                                                   RAG + LLM + validation
                                                                                  |
                                                                                  v
                                                                   PostgreSQL + pgvector
```

### Main Evolution Phases

1. **Production security and observability:** authentication/authorization, secret management, rate limiting, structured logs, monitoring, alerting, and health checks.
2. **Angular client:** a user interface for the existing HTTP endpoint and its success, clarification, refusal, and safety-escalation states.
3. **Conversations:** authenticated users, message history, retention rules, and conversation-aware context using the existing database direction.
4. **Human handoff:** an auditable workflow for reviewing `safety_escalation` cases with consent and explicit emergency guidance.
5. **Knowledge-base management:** source approval, versioning, ingestion status, metadata, replacement, and retrieval-quality evaluation.
6. **Evaluation and safety:** adversarial prompt-injection tests, safety regression datasets, model-cost monitoring, privacy review, and human evaluation before production use.

These are future directions only. The current project does not implement Angular, authentication, users, conversations at the API level, SSE, WebSockets, Redis, or an admin panel.

## Real-World Usage

**Not in production today.**

Potential users include:

1. A digital mental-health education platform answering CBT and self-reflection FAQs.
2. A wellness-product customer support team providing grounded first-line support with safety escalation.
3. An internal employee assistance portal offering bounded self-reflection guidance with human handoff.

Productionization requires authentication and authorization, encryption, privacy and consent controls, PII redaction, audit logs, curated data access, monitoring and alerting, human-in-the-loop handling for crisis cases, compliance review, and ongoing policy evaluation.

## Repository And Submission

Public repository: [github.com/NadiiaBulmak/support-agent](https://github.com/NadiiaBulmak/support-agent/tree/main)

## License

This project is licensed under the [MIT License](LICENSE). The license permits use, copying, modification, distribution, sublicensing, and sale of the software, subject to the notice and warranty terms in `LICENSE`.

The MIT license covers the project source code. Any CBT material added to `src/modules/knowledge/sources` must be checked separately and must comply with its own copyright and redistribution terms. This project is an educational support tool, not a production medical or emergency service.