// bot.js - Основной файл Telegram бота

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
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
  
  Object.keys(engines).forEach(key => {
    const engine = engines[key];
    buttons.push([{
      text: `${engine.icon} ${engine.name}`,
      callback_data: `engine_${key}`
    }]);
  });
  
  return { inline_keyboard: buttons };
}

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'друг';
  
  const welcomeMessage = `👋 Привет, ${userName}!

Я помогу улучшить твои промпты для любого AI-движка.

🎯 *Как это работает:*
1. Выбери AI-движок командой /select
2. Напиши свой промпт на русском или английском
3. Получи профессионально улучшенный промпт

✨ *Что я умею:*
• Переводить с русского на английский
• Структурировать промпт правильно
• Добавлять технические параметры
• Учитывать особенности каждого движка

📝 *Доступные команды:*
/select - Выбрать AI-движок
/help - Справка
/info - Информация о текущем движке

Начни с команды /select чтобы выбрать движок! 🚀`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /help
 */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `📖 *Справка по использованию*

*Основные команды:*
/start - Начать работу
/select - Выбрать AI-движок
/info - Информация о выбранном движке
/help - Эта справка

*Как использовать:*
1️⃣ Выбери движок через /select
2️⃣ Напиши свой промпт (можно на русском!)
3️⃣ Получи улучшенную версию

*Примеры промптов:*

Для Midjourney:
_"девушка в красном платье на улице"_

Для Runway (видео):
_"кот прыгает через препятствия"_

Для ChatGPT:
_"напиши статью о здоровом питании"_

*Советы:*
• Пиши конкретно, что хочешь увидеть
• Указывай настроение и атмосферу
• Не бойся деталей - я их структурирую!

Есть вопросы? Просто спроси! 💬`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /select - выбор движка
 */
bot.onText(/\/select/, (msg) => {
  const chatId = msg.chat.id;
  
  const message = `🎯 *Выберите AI-движок:*\n\n` +
    `💬 - Текстовые модели\n` +
    `🖼️ - Генерация изображений\n` +
    `🎦 - Генерация видео\n` +
    `🎭 - 3D модели`;
  
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
      '⚠️ Сначала выберите движок командой /select',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const engine = engines[selectedEngine];
  
  let infoMessage = `${engine.icon} *${engine.name}*\n\n`;
  infoMessage += `📝 ${engine.description}\n\n`;
  
  if (engine.maxLength) {
    infoMessage += `⏱️ Максимальная длина: ${engine.maxLength}\n\n`;
  }
  
  if (engine.parameters) {
    infoMessage += `⚙️ *Параметры:*\n${engine.parameters.join(', ')}\n\n`;
  }
  
  if (engine.template) {
    infoMessage += `📋 *Структура промпта:*\n\`${engine.template}\`\n\n`;
  }
  
  infoMessage += `💡 *Особенности:*\n`;
  engine.enhancementRules.forEach((rule, i) => {
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
      await bot.answerCallbackQuery(query.id, { text: '❌ Ошибка выбора движка' });
      return;
    }
    
    // Сохраняем выбор пользователя
    userSelections.set(chatId, engineKey);
    
    await bot.answerCallbackQuery(query.id, { 
      text: `✅ Выбран ${engine.name}` 
    });
    
    const confirmMessage = `✅ Выбран движок: ${engine.icon} *${engine.name}*\n\n` +
      `${engine.description}\n\n` +
      `Теперь просто отправь мне свой промпт, и я улучшу его! 🚀\n\n` +
      `_Используй /info чтобы узнать больше об этом движке_`;
    
    await bot.editMessageText(confirmMessage, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown'
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
  
  // Проверяем, выбран ли движок
  const selectedEngine = userSelections.get(chatId);
  
  if (!selectedEngine) {
    bot.sendMessage(chatId, 
      '⚠️ Сначала выберите AI-движок командой /select',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Отправляем сообщение о начале обработки
  const processingMsg = await bot.sendMessage(chatId, 
    '⏳ Улучшаю ваш промпт...',
    { parse_mode: 'Markdown' }
  );
  
  try {
    // Улучшаем промпт
    const result = await enhancePrompt(text, selectedEngine);
    
    // Форматируем и отправляем результат
    const formattedResult = formatResult(result);
    
    await bot.editMessageText(formattedResult, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });
    
    // Предлагаем выбрать другой движок
    const keyboard = {
      inline_keyboard: [[
        { text: '🔄 Другой движок', callback_data: 'change_engine' }
      ]]
    };
    
    await bot.sendMessage(chatId, 
      '_Хотите попробовать другой движок? Используйте /select_',
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
    
  } catch (error) {
    console.error('Error processing message:', error);
    
    await bot.editMessageText(
      '❌ Произошла ошибка при обработке промпта.\n\n' +
      'Попробуйте:\n' +
      '• Упростить промпт\n' +
      '• Попробовать позже\n' +
      '• Выбрать другой движок через /select',
      {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
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

console.log('✅ Бот готов к работе!');