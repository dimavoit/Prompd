# 🤖 Telegram Prompt Enhancer Bot

Telegram бот для улучшения промптов для различных AI-движков. Поддерживает текстовые модели, генерацию изображений, видео и 3D моделей.

## 🎯 Возможности

- ✅ Поддержка 14+ AI-движков
- 🌍 Автоматический перевод с русского на английский
- 🎨 Оптимизация промптов под каждый движок
- 💡 Советы по улучшению
- ⚡ Быстрая работа

## 🚀 Установка и запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-username/telegram-prompt-bot.git
cd telegram-prompt-bot
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Где взять токены:**
- **Telegram Bot Token**: [@BotFather](https://t.me/botfather) → `/newbot`
- **OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 4. Запуск локально

```bash
npm start
```

## 📦 Деплой на Render.com

### Подготовка

1. Закоммитьте код в GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **НЕ коммитьте файл .env!** (он уже в .gitignore)

### Настройка на Render.com

1. Войдите на [render.com](https://render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите ваш GitHub репозиторий
4. Заполните настройки:

**Build & Deploy:**
- **Name**: `prompt-enhancer-bot` (или любое имя)
- **Region**: `Frankfurt` (ближе к Европе)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables** (добавьте в Render.com):
```
TELEGRAM_BOT_TOKEN = ваш_токен_телеграм
OPENAI_API_KEY = ваш_ключ_openai
```

5. **Plan**: 
   - **Free** ($0) - засыпает после 15 мин неактивности
   - **Starter** ($7/мес) - работает 24/7 ✅ РЕКОМЕНДУЕТСЯ

6. Нажмите **Create Web Service**

### Ожидание деплоя

Render.com автоматически:
- Установит зависимости
- Запустит бота
- Покажет логи

Через 2-3 минуты бот будет работать!

## 🎮 Использование

1. Найдите бота в Telegram по username
2. Отправьте `/start`
3. Выберите AI-движок через `/select`
4. Отправьте ваш промпт
5. Получите улучшенную версию!

## 📝 Команды бота

- `/start` - Начать работу
- `/select` - Выбрать AI-движок
- `/info` - Информация о текущем движке
- `/help` - Справка

## 🤖 Поддерживаемые AI-движки

### 💬 Текстовые модели
- ChatGPT
- Claude
- Gemini

### 🖼️ Генерация изображений
- Midjourney
- DALL-E 3
- Stable Diffusion
- Leonardo.ai
- Ideogram

### 🎦 Генерация видео
- Runway Gen-3
- Pika Labs
- Kling AI
- Luma Dream Machine
- Stable Video Diffusion

### 🎭 3D модели
- Meshy 3D

## 💰 Стоимость

### OpenAI API
- **Модель**: GPT-4o-mini
- **Стоимость**: ~$0.0001 за промпт
- **Для 1000 промптов**: ~$0.10

### Render.com хостинг
- **Free**: $0 (с ограничениями)
- **Starter**: $7/мес (24/7 работа)

## 🔧 Разработка

### Структура проекта

```
telegram-prompt-bot/
├── bot.js              # Основная логика бота
├── config.js           # Конфигурация движков
├── promptEnhancer.js   # Улучшение промптов
├── package.json        # Зависимости
├── .env               # Переменные окружения (НЕ в git!)
└── README.md          # Документация
```

### Добавление нового движка

1. Откройте `config.js`
2. Добавьте новый движок:

```javascript
'newengine': {
  name: 'New Engine',
  icon: '🆕',
  category: 'image',
  description: 'Описание движка',
  enhancementRules: [
    'Правило 1',
    'Правило 2'
  ],
  template: '[Structure]'
}
```

3. Перезапустите бота

## 🐛 Решение проблем

### Бот не отвечает
- Проверьте правильность `TELEGRAM_BOT_TOKEN`
- Проверьте логи в Render.com
- Убедитесь, что сервис запущен

### Ошибка OpenAI API
- Проверьте правильность `OPENAI_API_KEY`
- Проверьте баланс на OpenAI аккаунте
- Убедитесь в доступе к API

### Render.com засыпает
- Используйте Starter план ($7/мес)
- Или настройте cron-job для пробуждения

## 📞 Поддержка

Вопросы и предложения:
- GitHub Issues
- Telegram: @yourusername

## 📄 Лицензия

MIT License - используйте свободно!

---

Сделано с ❤️ для русскоязычного AI-комьюнити