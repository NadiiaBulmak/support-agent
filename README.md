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

## What The Assignment Demonstrates

This project demonstrates a complete, tool-using AI agent workflow rather than a single prompt sent directly to an LLM:

| Requirement | Project implementation |
| --- | --- |
| Multi-step agent | `PlannerService` classifies the request, `ExecutorService` coordinates the workflow, tools retrieve data, Gemini generates an answer, and `AnswerValidatorService` checks the result. |
| At least two tools/functions | `validate_input`, `safety_check`, and `search_knowledge_base` are registered and dispatched through `ToolsRegistry`. |
| Structured JSON output | `AgentResultSchema` validates `status`, `answer`, `sources`, `confidence`, `intent`, and `decisionSummary`. |
| Human-readable response | The `answer` field contains the final explanation or safe refusal intended for the user. |
| Retrieval-augmented generation | The question is embedded and matched against PostgreSQL/pgvector chunks from the curated knowledge base. The full knowledge base is not sent to the LLM. |
| Guardrails | Input validation, deterministic crisis and medical checks, prompt-injection refusal, grounding validation, and clinical boundaries run before or around generation. |
| Reliability | Planner and generation retries, answer-validation retries, deterministic fallback plans, safe fallback answers, and error results prevent uncontrolled failure loops. |
| Observability | NestJS logs plus persisted `AgentRun` and `ToolCall` records capture decisions, statuses, inputs/outputs, durations, and final summaries. |
| Testing | Vitest unit tests cover tools and failure paths; Supertest e2e tests cover the HTTP workflow with external services mocked. |
| Business case | The agent provides bounded CBT psychoeducation and guided self-reflection while explicitly refusing diagnosis, medication advice, and emergency treatment. |

The implementation uses a custom NestJS orchestrator. This choice demonstrates explicit control over safety ordering, tool execution, retries, and validation while keeping the system easy to test and extend.

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

This section is the complete local setup path. The application is the NestJS API; PostgreSQL is provided separately by Docker Compose. The API does not start the database automatically.

### Prerequisites

- Node.js 22 or a compatible Node.js release;
- npm;
- Docker Desktop with Docker Compose, or another PostgreSQL 16 instance with the `vector` extension;
- a Gemini API key. The same key can be used for generation and embeddings unless the provider account requires separate keys;
- a legally redistributable CBT source file for ingestion.

### 1. Install dependencies

From the repository root:

```bash
npm install
npm run prisma:generate
```

`prisma:generate` generates the Prisma 7 client under `src/generated/prisma`, which is imported by the application.

### 2. Start PostgreSQL and pgvector

The included `docker-compose.yml` starts `pgvector/pgvector:pg16` with:

- database: `support_agent`;
- user: `postgres`;
- password: `postgres`;
- host port: `5435` (container port `5432`);
- persistent volume: `postgres_data`.

Start it in the repository root:

```bash
docker compose up -d postgres
docker compose ps
```

The matching local connection string is:

```text
postgresql://postgres:postgres@localhost:5435/support_agent?schema=public
```

Stop the database when finished:

```bash
docker compose down
```

To remove the database data as well and recreate it from scratch, use `docker compose down -v`. This deletes the local PostgreSQL volume.

If you use an external PostgreSQL/Neon database instead, do not start the Compose database and put that provider's connection string in `DATABASE_URL`. The database must have the `vector` extension enabled.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```powershell
Copy-Item .env.example .env
```

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/support_agent?schema=public
SOURCE_PATH=src/modules/knowledge/sources
FILE_NAME=cbt-material.md
LLM_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
FALLBACK_MODEL=gemini-3.5-flash-lite
PORT=3000
```

`DATABASE_URL` selects the PostgreSQL database. `SOURCE_PATH` is a directory, not a file: ingestion always reads `cbt-material.md` from that directory. API keys are required for planner, answer-generation, and embedding calls. Never commit `.env`.

### 4. Add the knowledge source

Create `src/modules/knowledge/sources/cbt-material.md` and place only material that you are allowed to use and redistribute. `FILE_NAME` selects the file that ingestion reads from `SOURCE_PATH`. The source is not included in this repository because its copyright and redistribution terms must be checked separately. Alternatively, set `SOURCE_PATH` to an existing directory containing that file.

The ingestion command cleans the file, splits it into chunks, creates Gemini embeddings with the configured `LLM_API_KEY`, and stores the document and chunks in PostgreSQL. It requires a reachable database and a valid `LLM_API_KEY`.

### 5. Apply the database schema

With PostgreSQL running and `.env` configured:

```bash
npm run prisma:validate
npm run db:migrate -- --name init
```

Use `db:migrate` for local development: it applies existing migrations and creates a new migration if the schema changed. For an already-built deployment image, use `npm run db:deploy` to apply committed migrations without creating new ones. Check the state with:

```bash
npm run db:status
```

The migration enables the PostgreSQL `vector` extension and creates the documents, chunks, agent runs, tool calls, conversations, and messages tables.

### 6. Ingest the knowledge base

Run ingestion once after the database schema is ready, and rerun it when the source changes:

```bash
npm run knowledge:ingest
```

This command builds the project first and then runs `dist/scripts/run-ingest.js`. It makes embedding API calls and may take time depending on the number of chunks. A successful run stores rows in `documents` and `document_chunks`.

Optional checks:

```bash
npm run knowledge:search
npm run db:studio
```

`knowledge:search` runs the repository's search script. `db:studio` opens Prisma Studio for inspecting the database.

### 7. Start the API

For development with watch mode:

```bash
npm run start:dev
```

For a production-style local run:

```bash
npm run build
npm run start:prod
```

The API is available at `http://localhost:3000`. The main endpoint is `POST http://localhost:3000/api/agent/run`; Swagger documentation is at `http://localhost:3000/api/docs`.

### Quick API testing with Swagger

Swagger UI provides a convenient browser-based way to test the API without writing a separate client or PowerShell command. Start the application with `npm run start:dev`, then open [http://localhost:3000/api/docs](http://localhost:3000/api/docs) in a browser.

In Swagger UI:

1. Expand `POST /api/agent/run`.
2. Click **Try it out**.
3. Enter a request body, for example:

```json
{
        "question": "What is cognitive restructuring in CBT?"
}
```

4. Click **Execute**.
5. Review the HTTP status and structured response containing `status`, `answer`, `sources`, `confidence`, `intent`, and `decisionSummary`.

Swagger is useful for quickly checking normal CBT questions, clarification requests, out-of-scope input, prompt-injection handling, and safety escalation. For a complete RAG request with retrieved sources, PostgreSQL/pgvector must be running, migrations must be applied, the knowledge source must be ingested, and the required Gemini environment variables must be configured.

Example request:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/agent/run -ContentType 'application/json' -Body '{"question":"What is catastrophizing in CBT?"}'
```

### Docker image for the API

`Dockerfile` builds only the NestJS API. PostgreSQL remains the separately managed Compose service, so the API container must receive a `DATABASE_URL` that points to a reachable database. Build and run it with:

```bash
docker build -t support-agent-api .
docker run --rm -p 3000:3000 --env-file .env support-agent-api
```

When the API runs in a container and PostgreSQL runs in the Compose network, use the database service name and container port in the connection string, for example `postgresql://postgres:postgres@postgres:5432/support_agent?schema=public`, and start both services on the same Docker network. The image does not run migrations or ingestion automatically; run those steps deliberately before serving traffic.

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
- `npm run test:e2e` exercises the HTTP controller and full agent workflow with external LLM, retrieval, and persistence dependencies mocked. It checks request validation and response statuses without requiring a live database or paid API calls.
- `npm run test` runs both unit and e2e suites.
- `npm run build` verifies TypeScript compilation and the production `dist` output used by the scripts and Docker image.
- `npm run lint` checks source and test code with Oxlint.
- `npm run prisma:validate` checks the Prisma schema and configuration.

The repository also includes manual scenario templates in `examples/inputs` and `examples/outputs`: `normal`, `psychoeducation`, `clarification`, `out-of-scope`, and `prompt-injection`. Use them against the running endpoint; replace `REPLACE_WITH...` values with observed responses while keeping the response contract. A live RAG smoke test additionally needs PostgreSQL/pgvector, a source document, valid API keys, completed migrations, and completed ingestion.

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

The current repository is intentionally an MVP backend. The next version can evolve it into a user-facing CBT support product while preserving the existing agent as the core domain service.

### Planned architecture

```text
                                                                                                 Angular client
                                                                                                                        |
                                                                                HTTP initially; SSE/WS later
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

### Recommended implementation phases

1. **Production foundation:** add authentication and authorization, secure secret management, rate limiting, structured logs, correlation IDs, metrics, alerting, migrations in deployment, and health checks.
2. **Angular client:** build the first user interface around the existing HTTP endpoint with clear status, source, confidence, clarification, refusal, and safety-escalation states. The current API remains the integration boundary.
3. **Conversations and messages:** add conversation creation, message history, ownership checks, retention rules, and a conversation-aware agent context. The existing `Conversation` and `Message` Prisma models provide a starting point, but the current endpoint does not use them yet.
4. **Human handoff:** connect `safety_escalation` to a reviewed human-support workflow with auditability, consent, and explicit emergency guidance. The agent must remain a support and education tool, not an emergency service.
5. **Knowledge operations:** add versioned sources, ingestion status, metadata validation, document replacement, retrieval evaluation, and an access-controlled process for approving CBT material.
6. **Realtime interaction:** consider SSE for streamed answer progress or WebSocket support for richer live conversations only after the HTTP workflow, persistence, and safety behavior are stable.
7. **Evaluation and compliance:** add adversarial prompt-injection tests, safety regression datasets, retrieval-quality metrics, model-cost monitoring, privacy review, and human evaluation before any real-world rollout.

This roadmap deliberately postpones authentication, users, conversations, Angular, SSE/WebSocket, Redis, and an admin panel until the local MVP is reliable. Each addition should keep the existing safety checks, grounded retrieval, structured result contract, and human escalation path intact.

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

The MIT license covers the project source code. Any external CBT material added to `knowledge/sources` must be checked separately and must comply with its own copyright and redistribution terms. This project is an educational support tool, not a production medical or emergency service.