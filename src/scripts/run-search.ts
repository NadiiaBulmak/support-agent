import { NestFactory } from '@nestjs/core';
import { AppModule } from '#/app.module.js';
import { SearchKnowledgeBaseService } from '#/modules/knowledge/search/searchKnowledgeBase.service.js';
import readline from 'node:readline/promises';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SearchKnowledgeBaseService);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const inputQuery = await rl.question('Enter your search query: ');
  rl.close();

  const query = inputQuery.trim().replace(/['"]/g, '');

  const results = await searchService.search(query, 2);

  results.forEach((res, i) => {
    console.log(`--- [Чанк ${i + 1}] (Distance: ${Number(res.distance).toFixed(4)}) ---`);
    console.log(res.content);
    console.log('\n');
  });

  await app.close();
}

bootstrap();