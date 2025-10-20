// database.js - SQLite управление данными v2.1

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prompd.db');
const db = new Database(dbPath);

// Включаем внешние ключи
db.pragma('foreign_keys = ON');

// Инициализация таблиц
function initializeDatabase() {
  // Таблица пользователей
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      subscription TEXT DEFAULT 'FREE',
      subscription_expires_at DATETIME,
      daily_usage_count INTEGER DEFAULT 0,
      daily_usage_reset_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица текущих сессий пользователей (для доработки промптов)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      user_id INTEGER PRIMARY KEY,
      selected_engine TEXT,
      original_prompt TEXT,
      current_enhanced_prompt TEXT,
      iteration_count INTEGER DEFAULT 0,
      refinements_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // Таблица истории промптов
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      engine TEXT NOT NULL,
      original_prompt TEXT NOT NULL,
      enhanced_prompt TEXT NOT NULL,
      iteration INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  console.log('✅ База данных инициализирована');
}

// Пользователи
function getOrCreateUser(userId, username) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  let user = stmt.get(userId);

  if (!user) {
    const insertStmt = db.prepare(`
      INSERT INTO users (user_id, username, subscription, created_at, updated_at)
      VALUES (?, ?, 'FREE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    insertStmt.run(userId, username);
    user = stmt.get(userId);
  }

  return user;
}

function getUserSubscription(userId) {
  const stmt = db.prepare('SELECT subscription FROM users WHERE user_id = ?');
  const result = stmt.get(userId);
  return result ? result.subscription : 'FREE';
}

function setUserSubscription(userId, subscription, daysValid = null) {
  let expiresAt = null;
  if (subscription !== 'LIFETIME' && daysValid) {
    const date = new Date();
    date.setDate(date.getDate() + daysValid);
    expiresAt = date.toISOString();
  }

  const stmt = db.prepare(`
    UPDATE users 
    SET subscription = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  stmt.run(subscription, expiresAt, userId);
}

// Проверка дневного лимита
function checkDailyLimit(userId) {
  const stmt = db.prepare(`
    SELECT daily_usage_count, daily_usage_reset_at FROM users WHERE user_id = ?
  `);
  const user = stmt.get(userId);

  if (!user) return { canUse: false, remaining: 0 };

  const now = new Date();
  const resetAt = new Date(user.daily_usage_reset_at || 0);

  // Если день прошел, сбрасываем счетчик
  if (now > resetAt) {
    const resetStmt = db.prepare(`
      UPDATE users 
      SET daily_usage_count = 0, daily_usage_reset_at = ?
      WHERE user_id = ?
    `);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    resetStmt.run(tomorrow.toISOString(), userId);
    return { canUse: true, remaining: 3 };
  }

  return {
    canUse: user.daily_usage_count < 3,
    remaining: Math.max(0, 3 - user.daily_usage_count)
  };
}

function incrementDailyUsage(userId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET daily_usage_count = daily_usage_count + 1
    WHERE user_id = ?
  `);
  stmt.run(userId);
}

// Сессии для доработки промптов
function getOrCreateSession(userId) {
  const stmt = db.prepare('SELECT * FROM user_sessions WHERE user_id = ?');
  let session = stmt.get(userId);

  if (!session) {
    const insertStmt = db.prepare(`
      INSERT INTO user_sessions (user_id) VALUES (?)
    `);
    insertStmt.run(userId);
    session = stmt.get(userId);
  }

  return session;
}

function updateSession(userId, data) {
  const session = getOrCreateSession(userId);
  const updateStmt = db.prepare(`
    UPDATE user_sessions 
    SET selected_engine = ?, original_prompt = ?, current_enhanced_prompt = ?, 
        iteration_count = ?, refinements_used = ?
    WHERE user_id = ?
  `);

  updateStmt.run(
    data.selectedEngine || session.selected_engine,
    data.originalPrompt || session.original_prompt,
    data.currentEnhancedPrompt || session.current_enhanced_prompt,
    data.iterationCount ?? session.iteration_count,
    data.refinementsUsed ?? session.refinements_used,
    userId
  );
}

function resetSession(userId) {
  const deleteStmt = db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
  deleteStmt.run(userId);
}

// История промптов
function savePromptToHistory(userId, engine, originalPrompt, enhancedPrompt, iteration = 0) {
  const stmt = db.prepare(`
    INSERT INTO prompt_history (user_id, engine, original_prompt, enhanced_prompt, iteration)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(userId, engine, originalPrompt, enhancedPrompt, iteration);
}

function getUserPromptHistory(userId, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM prompt_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(userId, limit);
}

module.exports = {
  db,
  initializeDatabase,
  getOrCreateUser,
  getUserSubscription,
  setUserSubscription,
  checkDailyLimit,
  incrementDailyUsage,
  getOrCreateSession,
  updateSession,
  resetSession,
  savePromptToHistory,
  getUserPromptHistory
};