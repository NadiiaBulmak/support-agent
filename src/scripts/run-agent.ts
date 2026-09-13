import { NestFactory } from '@nestjs/core';
import { AppModule } from '#/app.module.js';
import { AgentService } from '#/modules/agent/agent.service.js';
import { errorMessages } from '#/shared/constants/errorMessages.js';

async function bootstrap() {
  console.log('Ініціалізація RAG Агента...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const agentService = app.get(AgentService);

  const testQuestion = 'Що таке катастрофізація і як з нею працювати в КПТ?';

  console.log(`\n Запитання користувача: "${testQuestion}"\n`);
  console.log('🤖 Агент розмірковує та шукає інформацію в PostgreSQL...\n');

  try {
    const answer = await agentService.run(testQuestion);
    console.log('================ [ВІДПОВІДЬ АГЕНТА] ================');
    console.log(answer);
    console.log('====================================================\n');
  } catch (error) {
    console.error(errorMessages.scriptExecutionFailed, error);
  } finally {
    await app.close();
  }
}

bootstrap();