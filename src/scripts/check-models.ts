import 'dotenv/config';

async function checkModels() {
  const apiKey = process.env.EMBEDDING_API_KEY;
  
  if (!apiKey) {
    console.log('EMBEDDING_API_KEY не знайдено в .env');
    return;
  }

  console.log('Запит до Google API...');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();

  if (data.models) {
    // Шукаємо тільки ті моделі, які підтримують генерацію векторів (embedContent)
    const embedModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods?.includes('embedContent')
    );
    
    console.log('\n✅ ДОСТУПНІ МОДЕЛІ ДЛЯ ВЕКТОРІВ:');
    embedModels.forEach((m: any) => console.log(`- ${m.name} (вимірів: ${m.outputTokenLimit || 'не вказано'})`));
    
    if (embedModels.length === 0) {
      console.log('❌ Ваш API ключ не має доступу до жодної моделі ембедінгів.');
    }
  } else {
    console.log('Помилка від API:', data);
  }
}

checkModels();