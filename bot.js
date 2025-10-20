// bot.js - Telegram бот v2.1 с Stars монетизацией и доработкой промптов

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { engines, subscriptions } = require('./config');
const { enhancePrompt, refinePrompt, formatResult } = require('./promptEnhancer');
const {
  initializeDatabase,
  getOrCreateUser,
  getUserSubscription,
  setUserSubscription,
  checkDailyLimit,
  incrementDailyUsage,
  getOrCreateSession,
  updateSession,
  resetSession,
  savePromptToHistory
} = require('./database');

// Проверка переменных окружения
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.OPENAI_API_KEY) {
  console.error('❌ Отсутствуют обязательные переменные окружения');
  process.exit(1);
}

// Express сервер для health check (для Cron Job)
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

// Инициализация БД
initializeDatabase();

// Создаем бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

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
 * Кнопки для результата (доработать/новый)
 */
function createResultKeyboard() {
  return {
    inline_keyboard: [[
      { text: '🔄 Доработать', callback_data: 'refine' },
      { text: '➡️ Новый', callback_data: 'new_prompt' }
    ]]
  };
}

/**
 * Команда /start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'друг';
  
  getOrCreateUser(chatId, msg.from.username);
  
  const welcomeMessage = `👋 Привет, ${userName}!

Я *Prompd* - улучшаю промпты для AI-движков.

🎯 *Как работает:*
1. Выбери движок → /select
2. Напиши промпт (можно на русском)
3. Получи улучшенную версию
4. Доработай если нужно

✨ *Поддерживаю:*
🖼️ Изображения: Midjourney, DALL-E, Flux, Firefly, Soul, Ideogram, Nanobanana
🎦 Видео: Runway, Pika, Kling, Luma, Sora 2, Stable Video
🎭 3D: Meshy

🆓 *Free план:*
3 промпта/день, все движки

⭐ *PRO (990 ₽/мес):*
Безлимитные промпты, доработки

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
/subscribe - Подписка на PRO
/status - Твой статус
/help - Справка

*Как работать:*
1. Выбери движок
2. Пиши промпт
3. Нажимай "Доработать" если нужны изменения
4. Или "Новый" для нового промпта

Просто пиши что хочешь - я структурирую! 💬`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /status - информация о подписке
 */
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const subscription = getUserSubscription(chatId);
  const sub = subscriptions[subscription];
  const limitInfo = checkDailyLimit(chatId);

  let statusMessage = `📊 *Твой статус:*\n\n`;
  statusMessage += `Подписка: *${sub.name}*\n`;
  
  if (subscription === 'FREE') {
    statusMessage += `📝 Промптов сегодня: ${3 - limitInfo.remaining}/3\n`;
    statusMessage += `Осталось: *${limitInfo.remaining}*\n\n`;
    statusMessage += `💎 Хочешь больше?\n`;
    statusMessage += `/subscribe - получи PRO доступ`;
  } else if (subscription === 'PRO') {
    statusMessage += `✨ Безлимитные промпты\n`;
    statusMessage += `✨ Безлимитные доработки\n\n`;
    statusMessage += `🎉 Спасибо за поддержку!`;
  }

  bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

/**
 * Команда /subscribe
 */
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;

  const subscribeMessage = `💎 *Подписка на Prompd*

🆓 *Сейчас ты на FREE:*
• 3 промпта в день
• Все движки
• Без доработок

⭐ *PRO - 990 ₽/мес*
✅ Безлимитные промпты
✅ Все движки
✅ Безлимитные доработки
✅ Автопродление

Нажми кнопку ниже чтобы оплатить`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '⭐ PRO (990 ₽/мес)', callback_data: 'pay_pro' }]
    ]
  };

  bot.sendMessage(chatId, subscribeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

/**
 * Команда /select - выбор движка
 */
bot.onText(/\/select/, (msg) => {
  const chatId = msg.chat.id;
  
  const message = `🎯 *Выбери AI-движок:*`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: createEngineKeyboard()
  });
});

/**
 * Команда /info
 */
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const session = getOrCreateSession(chatId);
  
  if (!session.selected_engine) {
    bot.sendMessage(chatId, 
      '⚠️ Сначала выбери движок → /select',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const engine = engines[session.selected_engine];
  
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
 * Обработка Telegram Stars платежей
 */
bot.on('pre_checkout_query', async (query) => {
  bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('successful_payment', (msg) => {
  const chatId = msg.chat.id;
  const payload = msg.successful_payment.invoice_payload;

  if (payload === 'pro_subscription') {
    setUserSubscription(chatId, 'PRO', 30);
    bot.sendMessage(chatId, 
      '✅ *Спасибо за подписку на PRO!*\n\n' +
      'Теперь у тебя:\n' +
      '✨ Безлимитные промпты\n' +
      '✨ Все движки\n' +
      '✨ Безлимитные доработки\n\n' +
      'Начни с /select 🚀',
      { parse_mode: 'Markdown' }
    );
  }
});

/**
 * Обработка callback queries
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // Выбор движка
    if (data.startsWith('engine_')) {
      const engineKey = data.replace('engine_', '');
      const engine = engines[engineKey];
      
      if (!engine) {
        await bot.answerCallbackQuery(query.id, { text: '❌ Ошибка' });
        return;
      }

      updateSession(chatId, { 
        selectedEngine: engineKey,
        currentEnhancedPrompt: null,
        iterationCount: 0,
        refinementsUsed: 0
      });
      
      await bot.answerCallbackQuery(query.id, { text: `✅ ${engine.name}` });
      
      const confirmMessage = `✅ *${engine.icon} ${engine.name}*\n\n` +
        `${engine.description}\n\n` +
        `Отправь промпт - я улучшу! 🚀`;
      
      await bot.editMessageText(confirmMessage, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown'
      });
    }

    // Доработка промпта
    else if (data === 'refine') {
      await bot.answerCallbackQuery(query.id);
      
      const msg = await bot.sendMessage(chatId, 
        '📝 Что изменить в промпте?\n\n' +
        '_Например: "добавь больше деталей" или "сделай короче"_',
        { parse_mode: 'Markdown' }
      );

      // Ждем ответ пользователя
      bot.onReplyToMessage(chatId, msg.message_id, async (replyMsg) => {
        await handleRefinement(chatId, replyMsg.text);
      });
    }

    // Новый промпт
    else if (data === 'new_prompt') {
      await bot.answerCallbackQuery(query.id);
      resetSession(chatId);
      
      const message = `🎯 *Выбери AI-движок:*`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: createEngineKeyboard()
      });
    }

    // Оплата подписок
    else if (data === 'pay_pro') {
      const title = 'PRO подписка';
      const description = 'Безлимитные промпты на месяц';
      const payload = 'pro_subscription';
      const priceInCopeks = 99900; // 990 руб в копейках

      await bot.sendInvoice(chatId, {
        title: title,
        description: description,
        payload: payload,
        provider_token: '', // Telegram Stars не требует токена
        currency: 'XTR', // XTR - это Telegram Stars
        prices: [{ label: '990 ₽', amount: priceInCopeks }],
        reply_markup: {
          inline_keyboard: [[
            { text: '⭐ Оплатить 990 ₽', callback_data: 'dummy' }
          ]]
        }
      }).catch(err => {
        bot.sendMessage(chatId,
          '❌ Ошибка при открытии платежа\n\n' +
          'Попробуй позже или обратись в поддержку',
          { parse_mode: 'Markdown' }
        );
      });
    }

  } catch (error) {
    console.error('Error in callback_query:', error);
  }
});

/**
 * Обработка обычных сообщений (промптов)
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команды и служебные сообщения
  if (!text || text.startsWith('/') || msg.successful_payment) {
    return;
  }

  try {
    const subscription = getUserSubscription(chatId);
    const session = getOrCreateSession(chatId);

    // Проверяем выбран ли движок
    if (!session.selected_engine) {
      bot.sendMessage(chatId, 
        '⚠️ Выбери движок → /select',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Проверяем лимит для FREE плана
    if (subscription === 'FREE') {
      const limitInfo = checkDailyLimit(chatId);
      if (!limitInfo.canUse) {
        bot.sendMessage(chatId,
          '❌ Исчерпан лимит на сегодня (5 промптов)\n\n' +
          '💎 Получи неограниченный доступ:\n' +
          '/subscribe',
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    const processingMsg = await bot.sendMessage(chatId, '⏳ Улучшаю промпт...');

    let result;

    // Если это доработка существующего промпта
    if (session.current_enhanced_prompt) {
      result = await refinePrompt(
        session.original_prompt,
        session.current_enhanced_prompt,
        text,
        session.selected_engine
      );
    } else {
      // Новый промпт
      result = await enhancePrompt(text, session.selected_engine);
    }

    if (!result.success) {
      await bot.editMessageText(`❌ ${result.error}`, {
        chat_id: chatId,
        message_id: processingMsg.message_id
      });
      return;
    }

    // Сохраняем в сессию
    updateSession(chatId, {
      originalPrompt: text,
      currentEnhancedPrompt: result.enhanced,
      iterationCount: session.iteration_count + 1
    });

    // Сохраняем в БД
    savePromptToHistory(
      chatId,
      session.selected_engine,
      text,
      result.enhanced,
      session.iteration_count
    );

    // Показываем результат с кнопками
    const formattedResult = formatResult(result);
    
    await bot.editMessageText(formattedResult, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Добавляем кнопки для доработки/новый
    await bot.sendMessage(chatId, '💡 Что дальше?', {
      reply_markup: createResultKeyboard()
    });

    // Увеличиваем счетчик для FREE плана
    if (subscription === 'FREE') {
      incrementDailyUsage(chatId);
    }

  } catch (error) {
    console.error('Error processing message:', error);
    bot.sendMessage(chatId, '❌ Ошибка обработки. Попробуй позже');
  }
});

/**
 * Обработка доработки промпта
 */
async function handleRefinement(chatId, refinementText) {
  try {
    const session = getOrCreateSession(chatId);
    const subscription = getUserSubscription(chatId);

    if (!session.current_enhanced_prompt) {
      bot.sendMessage(chatId, '❌ Нет промпта для доработки');
      return;
    }

    // Проверяем лимит доработок для FREE
    if (subscription === 'FREE' && session.refinements_used >= 1) {
      bot.sendMessage(chatId,
        '❌ Исчерпан лимит доработок (1 на промпт)\n\n' +
        '💎 PRO: безлимитные доработки\n' +
        '/subscribe',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const processingMsg = await bot.sendMessage(chatId, '⏳ Доработаю промпт...');

    const result = await refinePrompt(
      session.original_prompt,
      session.current_enhanced_prompt,
      refinementText,
      session.selected_engine
    );

    if (!result.success) {
      await bot.editMessageText(`❌ ${result.error}`, {
        chat_id: chatId,
        message_id: processingMsg.message_id
      });
      return;
    }

    // Обновляем сессию
    updateSession(chatId, {
      currentEnhancedPrompt: result.enhanced,
      iterationCount: session.iteration_count + 1,
      refinementsUsed: session.refinements_used + 1
    });

    const formattedResult = formatResult(result);
    
    await bot.editMessageText(formattedResult, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });

    await bot.sendMessage(chatId, '💡 Что дальше?', {
      reply_markup: createResultKeyboard()
    });

  } catch (error) {
    console.error('Error in refinement:', error);
    bot.sendMessage(chatId, '❌ Ошибка доработки. Попробуй позже');
  }
}

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

console.log('✅ Prompd v2.1 готов к работе!');