import { NestFactory } from '@nestjs/core';
import { AppModule } from '#/app.module.js';
import { AgentService } from '#/modules/agent/agent.service.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';

async function bootstrap() {
  console.log('Initializing RAG Agent...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const agentService = app.get(AgentService);

  const testQuestion = 'What is catastrophization and how to deal with it in CBT?';

  console.log(`\n Question: "${testQuestion}"\n`);
  console.log('🤖 Agent is thinking and searching for information in PostgreSQL...\n');

  try {
    const answer = await agentService.run(testQuestion);
    console.log('================ [AGENT RESPONSE] ================');
    console.log(answer);
    console.log('====================================================\n');
  } catch (error) {
    console.error(errorMessages.scriptExecutionFailed, error);
  } finally {
    await app.close();
  }
}

bootstrap();