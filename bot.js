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
  const buttons