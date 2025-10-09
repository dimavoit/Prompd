// promptEnhancer.js - Логика улучшения промптов через OpenAI

const OpenAI = require('openai');
const { engines } = require('./config');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Определяет язык текста (упрощенно)
 */
function detectLanguage(text) {
  const cyrillicPattern = /[а-яА-ЯёЁ]/;
  return cyrillicPattern.test(text) ? 'ru' : 'en';
}

/**
 * Улучшает промпт для конкретного AI движка
 */
async function enhancePrompt(userPrompt, engineKey) {
  const engine = engines[engineKey];
  
  if (!engine) {
    throw new Error(`Неизвестный движок: ${engineKey}`);
  }

  const userLanguage = detectLanguage(userPrompt);
  
  // Создаем system prompt для GPT-4
  const systemPrompt = `Ты эксперт по созданию промптов для ${engine.name}.

ИНФОРМАЦИЯ О ДВИЖКЕ:
Название: ${engine.name}
Категория: ${engine.category}
Описание: ${engine.description}
${engine.maxLength ? `Максимальная длина видео: ${engine.maxLength}` : ''}
${engine.template ? `Рекомендуемая структура: ${engine.template}` : ''}
${engine.parameters ? `Доступные параметры: ${engine.parameters.join(', ')}` : ''}

ПРАВИЛА УЛУЧШЕНИЯ ПРОМПТА:
${engine.enhancementRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}

ТВОЯ ЗАДАЧА:
1. Пользователь написал промпт на ${userLanguage === 'ru' ? 'русском' : 'английском'} языке
2. Улучши этот промпт согласно правилам выше для ${engine.name}
3. Верни результат СТРОГО в следующем JSON формате:

{
  "enhanced_prompt": "улучшенный промпт на английском языке",
  "translation_ru": "перевод улучшенного промпта на русский для понимания",
  "explanation": "краткое объяснение на русском, что было улучшено и почему",
  "tips": ["совет 1", "совет 2", "совет 3"]
}

ВАЖНО:
- enhanced_prompt ВСЕГДА на английском, даже если пользователь писал на русском
- translation_ru - это перевод enhanced_prompt на русский
- explanation и tips всегда на русском
- Сохраняй основную идею пользователя, но улучшай структуру и детали
- Не добавляй ничего лишнего, только JSON`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Используем более быструю модель для экономии
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    return {
      success: true,
      original: userPrompt,
      enhanced: result.enhanced_prompt,
      translation: result.translation_ru,
      explanation: result.explanation,
      tips: result.tips || [],
      engine: engine.name,
      engineIcon: engine.icon
    };

  } catch (error) {
    console.error('Error enhancing prompt:', error);
    
    return {
      success: false,
      error: 'Произошла ошибка при улучшении промпта. Попробуйте еще раз.',
      details: error.message
    };
  }
}

/**
 * Форматирует результат для отправки пользователю
 */
function formatResult(result) {
  if (!result.success) {
    return `❌ ${result.error}`;
  }

  let message = `${result.engineIcon} *${result.engine}*\n\n`;
  
  message += `📝 *Ваш промпт:*\n_${result.original}_\n\n`;
  
  message += `✨ *Улучшенный промпт (английский):*\n\`\`\`\n${result.enhanced}\n\`\`\`\n\n`;
  
  message += `🔄 *Перевод для понимания:*\n${result.translation}\n\n`;
  
  message += `💡 *Что улучшено:*\n${result.explanation}\n\n`;
  
  if (result.tips && result.tips.length > 0) {
    message += `📌 *Советы по использованию:*\n`;
    result.tips.forEach((tip, i) => {
      message += `${i + 1}. ${tip}\n`;
    });
  }
  
  return message;
}

module.exports = {
  enhancePrompt,
  formatResult,
  detectLanguage
};
