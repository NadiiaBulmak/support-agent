import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect, vi } from 'vitest';
import { AgentModule } from '#/modules/agent/agent.module.js';
import { PlannerService } from '#/modules/agent/planner/planner.service.js';
import { LlmService } from '#/modules/agent/llm/llm.service.js';
import { ToolsRegistry } from '#/modules/tools/registry/tools.registry.js';
import { KnowledgeModule } from '#/modules/knowledge/knowledge.module.js';
import { PrismaService } from '#/modules/db/prisma/prisma.service.js';
import { AgentResultStatus } from '#/shared/enums/domain.enums.js';

describe('AgentController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    agentRun: { create: vi.fn().mockResolvedValue({ id: 'mock-run-id' }) },
    toolCall: { create: vi.fn().mockResolvedValue({ id: 'mock-tool-id' }) },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AgentModule,
        KnowledgeModule,
      ],
    })
      .overrideProvider(PlannerService)
      .useValue({
        plan: vi.fn().mockResolvedValue({
          intent: 'psychoeducation',
          needsKnowledgeSearch: true,
        }),
      })
      .overrideProvider(LlmService)
      .useValue({
        generateAnswer: vi.fn().mockResolvedValue('This is a mocked CBT answer.'),
      })
      .overrideProvider(ToolsRegistry)
      .useValue({
        execute: vi.fn((name: string, input: string) => {
          if (name === 'validate_input') return { isValid: true };
          if (name === 'safety_check') {
            return input.includes('kill myself') ? 'needs_escalation' : 'safe';
          }
          return Promise.resolve([
            {
              id: 'chunk-1',
              content: 'CBT psychoeducation context.',
              chunkIndex: 0,
              documentId: 'document-1',
              distance: 0.1,
            },
          ]);
        }),
      })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns 400 for an empty question', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/run')
      .send({ question: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Question cannot be empty');
  });

  it('returns safety_escalation for a crisis request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/run')
      .send({ question: 'I want to kill myself' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('safety_escalation');
    expect(response.body.answer).toContain('emergency services');
  });

  it('returns a mocked successful CBT answer', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/agent/run')
      .send({ question: 'How do I stop overthinking?' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(AgentResultStatus.SUCCESS);
    expect(response.body.answer).toBe('This is a mocked CBT answer.');
  });
});