// bot.js - Основной файл Telegram бота v2.0 + Cron Support

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { engines } = require('./config');
const { enhancePrompt, formatResult } = require('./promptEnhancer');

// Проверка переменных окружения
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле!');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY не найден в .env файле!');
  process.exit(1);
}

// Создаем Express сервер для health check (для Cron Job)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Prompd bot is running!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: 'running',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server listening on port ${PORT}`);
});

// Создаем бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Хранилище выбранных движков пользователей
const userSelections = new Map();

console.log('🤖 Бот запущен успешно!');

/**
 * Создает клавиатуру с выбором движков
 */
function createEngineKeyboard() {
  const buttons = [];
  
  const imageEngines = [];
  const videoEngines = [];
  const other = [];
  
  Object.keys(engines).forEach(key => {
    const engine = engines[key];
    const buttonData = {
      text: `${engine.icon} ${engine.name}`,
      callback_data: `engine_${key}`
    };
    
    if (engine.category === 'image') {
      imageEngines.push([buttonData]);
    } else if (engine.category === 'video') {
      videoEngines.push([buttonData]);
    } else {
      other.push([buttonData]);
    }
  });
  
  return { 
    inline_keyboard: [...imageEngines, ...videoEngines, ...other]
  };
}

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'друг';
  
  const welcomeMessage = `👋 Привет, ${userName}!

Я *Prompd* - улучшаю промпты для AI-движков.

🎯 *Как работает:*
1. Выбери движок → /select
2. Напиши промпт (можно на русском)
3. Получи улучшенную версию

✨ *Поддерживаю:*
🖼️ Изображения: Midjourney, DALL-E, Flux, Firefly, Soul, Ideogram, Nanobanana
🎦 Видео: Runway, Pika, Kling, Luma, Sora 2, Stable Video
🎭 3D: Meshy

Начни с /select! 🚀`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /help
 */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `📖 *Справка Prompd*

*Команды:*
/start - Начать
/select - Выбрать движок
/info - Инфо о движке
/help - Справка

*Примеры:*

_Midjourney:_
"кот на луне"

_Runway (видео):_
"девушка танцует в парке"

_Flux (фото):_
"портрет мужчины 40 лет"

Просто пиши что хочешь - я структурирую! 💬`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /select - выбор движка
 */
bot.onText(/\/select/, (msg) => {
  const chatId = msg.chat.id;
  
  const message = `🎯 *Выбери AI-движок:*\n\n` +
    `🖼️ Изображения\n` +
    `🎦 Видео\n` +
    `🎭 3D модели`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: createEngineKeyboard()
  });
});

/**
 * Команда /info - информация о выбранном движке
 */
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const selectedEngine = userSelections.get(chatId);
  
  if (!selectedEngine) {
    bot.sendMessage(chatId, 
      '⚠️ Сначала выбери движок → /select',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const engine = engines[selectedEngine];
  
  let infoMessage = `${engine.icon} *${engine.name}*\n\n`;
  infoMessage += `📝 ${engine.description}\n\n`;
  
  if (engine.maxLength) {
    infoMessage += `⏱️ Макс. длина: ${engine.maxLength}\n\n`;
  }
  
  if (engine.parameters) {
    infoMessage += `⚙️ *Параметры:* ${engine.parameters.join(', ')}\n\n`;
  }
  
  infoMessage += `💡 *Особенности:*\n`;
  engine.enhancementRules.slice(0, 3).forEach((rule, i) => {
    infoMessage += `${i + 1}. ${rule}\n`;
  });
  
  bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
});

/**
 * Обработка нажатий на inline кнопки
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('engine_')) {
    const engineKey = data.replace('engine_', '');
    const engine = engines[engineKey];
    
    if (!engine) {
      await bot.answerCallbackQuery(query.id, { text: '❌ Ошибка' });
      return;
    }
    
    // Сохраняем выбор
    userSelections.set(chatId, engineKey);
    
    await bot.answerCallbackQuery(query.id, { 
      text: `✅ ${engine.name}` 
    });
    
    const confirmMessage = `✅ *${engine.icon} ${engine.name}*\n\n` +
      `${engine.description}\n\n` +
      `Отправь промпт - я улучшу! 🚀`;
    
    await bot.editMessageText(confirmMessage, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
    });
  } else if (data === 'change_engine') {
    await bot.answerCallbackQuery(query.id);
    
    const message = `🎯 *Выбери другой движок:*`;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: createEngineKeyboard()
    });
  }
});

/**
 * Обработка текстовых сообщений (промптов)
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Игнорируем команды
  if (text && text.startsWith('/')) {
    return;
  }
  
  // Проверяем выбран ли движок
  const selectedEngine = userSelections.get(chatId);
  
  if (!selectedEngine) {
    bot.sendMessage(chatId, 
      '⚠️ Выбери движок → /select',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Сообщение о начале обработки
  const processingMsg = await bot.sendMessage(chatId, 
    '⏳ Улучшаю промпт...'
  );
  
  try {
    // Улучшаем промпт
    const result = await enhancePrompt(text, selectedEngine);
    
    // Форматируем результат
    const formattedResult = formatResult(result);
    
    await bot.editMessageText(formattedResult, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });
    
    // Кнопка для смены движка
    const keyboard = {
      inline_keyboard: [[
        { text: '🔄 Другой движок', callback_data: 'change_engine' }
      ]]
    };
    
    await bot.sendMessage(chatId, 
      '_Изменить движок → /select_',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
    
  } catch (error) {
    console.error('Error processing message:', error);
    
    await bot.editMessageText(
      '❌ Ошибка обработки.\n\nПопробуй:\n• Упростить промпт\n• Другой движок /select',
      {
        chat_id: chatId,
        message_id: processingMsg.message_id
      }
    );
  }
});

/**
 * Обработка ошибок
 */
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

console.log('✅ Prompd v2.0 готов к работе!');