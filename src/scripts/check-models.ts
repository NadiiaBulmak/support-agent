import 'dotenv/config';
import { EnvironmentVariables } from '#/shared/enums/domain.enums.js';
import { ModelsResponse } from '#/shared/interfaces/embeddingModel.js';

async function checkModels() {
  const apiKey = process.env[EnvironmentVariables.API_KEY];
  
  if (!apiKey) {
    console.log('LLM_API_KEY not found in .env');
    return;
  }

  console.log('Querying Google API...');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = (await response.json()) as ModelsResponse;

  if (data.models) {
    const embedModels = data.models.filter((model) =>
      model.supportedGenerationMethods?.includes('embedContent')
    );
    
    console.log('\n✅ AAvailable embedding models:');
    embedModels.forEach((model) => console.log(`- ${model.name} (dimensions: ${model.outputTokenLimit || 'not specified'})`));
    
    if (embedModels.length === 0) {
      console.log('❌ Your API key does not have access to any embedding models.');
    }
  } else {
    console.log('Error from API:', data);
  }
}

checkModels();