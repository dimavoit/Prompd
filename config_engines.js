// config.js - Конфигурация всех AI движков

const engines = {
  // Текстовые модели
  'chatgpt': {
    name: 'ChatGPT',
    icon: '💬',
    category: 'text',
    description: 'Универсальные задачи, диалоги, креатив',
    enhancementRules: [
      'Структурировать запрос по принципу: Роль → Задача → Контекст → Формат',
      'Добавить примеры желаемого результата',
      'Указать tone of voice (формальный, дружелюбный, профессиональный)',
      'Разбить сложные задачи на шаги',
      'Использовать "Think step by step" для логических задач'
    ],
    template: '[Role] + [Task] + [Context] + [Format] + [Constraints]'
  },
  
  'claude': {
    name: 'Claude',
    icon: '💬',
    category: 'text',
    description: 'Аналитика, длинные тексты, код',
    enhancementRules: [
      'Использовать XML теги для структуры: <context>, <task>, <examples>',
      'Давать подробный контекст перед задачей',
      'Для кода указывать язык и версию',
      'Просить "reasoning" для сложных задач',
      'Использовать многоступенчатые инструкции'
    ],
    template: '<context>...</context> <task>...</task> <requirements>...</requirements>'
  },
  
  'gemini': {
    name: 'Gemini',
    icon: '💬',
    category: 'text',
    description: 'Google интеграция, мультимодальность',
    enhancementRules: [
      'Указывать связь с Google сервисами если нужно',
      'Описывать визуальные элементы детально',
      'Использовать конкретные метрики и данные',
      'Структурировать по пунктам',
      'Добавлять ссылки на дополнительные материалы'
    ],
    template: '[Goal] + [Data/Context] + [Output Format] + [Integration needs]'
  },

  // Генерация изображений
  'midjourney': {
    name: 'Midjourney',
    icon: '🖼️',
    category: 'image',
    description: 'Художественные изображения',
    parameters: ['--ar', '--style', '--v 6', '--q 2', '--s'],
    enhancementRules: [
      'Начинать с главного субъекта',
      'Добавлять художественный стиль (oil painting, watercolor, digital art)',
      'Указывать освещение (dramatic lighting, golden hour, studio lighting)',
      'Описывать композицию (close-up, wide angle, bird\'s eye view)',
      'Добавлять атмосферу и настроение',
      'Использовать параметры: --ar 16:9 --v 6 --q 2'
    ],
    template: '[Subject] + [Style] + [Composition] + [Lighting] + [Mood] + [Parameters]'
  },
  
  'dalle': {
    name: 'DALL-E 3',
    icon: '🖼️',
    category: 'image',
    description: 'Точное следование промпту',
    enhancementRules: [
      'Очень детальное описание каждого элемента',
      'Указывать точное расположение объектов',
      'Описывать цвета конкретно (не "красный", а "crimson red")',
      'Добавлять текстуры и материалы',
      'Использовать полные предложения, избегать списков',
      'Не использовать художников после 1912 года'
    ],
    template: '[Detailed subject description] in [environment] with [specific details] and [colors/textures]'
  },
  
  'stablediffusion': {
    name: 'Stable Diffusion',
    icon: '🖼️',
    category: 'image',
    description: 'Гибкость и контроль',
    parameters: ['steps', 'cfg_scale', 'sampler', 'seed'],
    enhancementRules: [
      'Использовать ключевые слова через запятую',
      'Начинать с самого важного',
      'Добавлять веса к словам: (keyword:1.3)',
      'Negative prompt для нежелательных элементов',
      'Указывать качество: masterpiece, best quality, highly detailed',
      'Технические параметры: steps: 30-50, cfg_scale: 7-11'
    ],
    template: 'masterpiece, best quality, [main subject], [style], [details], [lighting]'
  },
  
  'leonardo': {
    name: 'Leonardo.ai',
    icon: '🖼️',
    category: 'image',
    description: 'Игровая графика, концепт-арт',
    enhancementRules: [
      'Указывать стиль игры или жанр (RPG, sci-fi, fantasy)',
      'Описывать character design элементы',
      'Добавлять "game asset" или "concept art" в промпт',
      'Указывать перспективу (isometric, side view, top-down)',
      'Описывать level design элементы',
      'Упоминать референсы (like Diablo, Zelda style)'
    ],
    template: '[Game genre] [asset type], [subject], [art style], [perspective], [mood]'
  },
  
  'ideogram': {
    name: 'Ideogram',
    icon: '🖼️',
    category: 'image',
    description: 'Текст на изображениях',
    enhancementRules: [
      'Указывать текст в кавычках: text "Your Text Here"',
      'Описывать стиль шрифта (bold, elegant, handwritten)',
      'Указывать расположение текста',
      'Добавлять контекст для дизайна (logo, poster, banner)',
      'Описывать фон и элементы вокруг текста',
      'Использовать простые, читаемые фразы'
    ],
    template: '[Design type] with text "[Your Text]", [font style], [background], [composition]'
  },

  // Генерация видео
  'runway': {
    name: 'Runway Gen-3',
    icon: '🎦',
    category: 'video',
    maxLength: '5-10 sec',
    description: 'Кинематографическое качество',
    enhancementRules: [
      'Начинать с camera movement (dolly in, tracking shot, crane shot)',
      'Детально описывать действие',
      'Добавлять кинематографические термины',
      'Указывать освещение (cinematic lighting, dramatic shadows)',
      'Описывать атмосферу (moody, ethereal, intense)',
      'Упоминать film grain или качество (4K, photorealistic)'
    ],
    template: '[Camera movement], [subject] [action], [environment], [lighting], [mood], [technical quality]'
  },
  
  'pika': {
    name: 'Pika Labs',
    icon: '🎦',
    category: 'video',
    maxLength: '3-4 sec',
    description: 'Анимация и эффекты',
    parameters: ['-motion', '-fps', '-ar'],
    enhancementRules: [
      'Добавлять параметр -motion [1-4] (1=минимум, 4=максимум движения)',
      'Указывать -fps 24 для cinematic look',
      'Выбирать aspect ratio: -ar 16:9 или -ar 1:1',
      'Детально описывать траекторию движения',
      'Использовать "smooth", "dynamic", "fluid" для описания',
      'Указывать скорость (slow motion, time-lapse)'
    ],
    template: '[Subject] [detailed action description], [style] -motion 3 -fps 24 -ar 16:9'
  },
  
  'kling': {
    name: 'Kling AI',
    icon: '🎦',
    category: 'video',
    maxLength: 'до 2 минут',
    description: 'Реализм и лица',
    enhancementRules: [
      'Очень детально описывать внешность персонажей',
      'Указывать физически правдоподобные действия',
      'Описывать окружение и реквизит',
      'Добавлять camera work (pan, tilt, zoom)',
      'Указывать время суток и погоду',
      'Использовать "photorealistic" или "cinematic realism"'
    ],
    template: '[Detailed character], [realistic action], [environment details], [camera work], [lighting/atmosphere]'
  },
  
  'luma': {
    name: 'Luma Dream Machine',
    icon: '🎦',
    category: 'video',
    maxLength: '5 sec',
    description: 'Быстрая генерация, естественное движение',
    enhancementRules: [
      'Начинать с глагола действия (flowing, spinning, transforming)',
      'Описывать естественные физические процессы',
      'Избегать сложных спецэффектов',
      'Фокусироваться на одном главном движении',
      'Добавлять настроение (serene, energetic, peaceful)',
      'Использовать природные элементы (water, wind, light)'
    ],
    template: '[Action verb] [subject], [natural movement], [environment], [mood]'
  },
  
  'stablevideo': {
    name: 'Stable Video Diffusion',
    icon: '🎦',
    category: 'video',
    maxLength: '3-4 sec',
    description: 'Open-source контроль',
    parameters: ['motion_bucket_id', 'fps', 'seed'],
    enhancementRules: [
      'Описывать движение пошагово',
      'Указывать motion intensity (motion_bucket_id: 40-127)',
      'Добавлять технические параметры',
      'Использовать seed для воспроизводимости',
      'Описывать начальный и конечный кадр',
      'Указывать fps (обычно 6-24)'
    ],
    template: '[Starting frame description] → [motion path] → [ending frame], motion_bucket_id: 80, fps: 12'
  },

  // 3D и специализированные
  'meshy': {
    name: 'Meshy 3D',
    icon: '🎭',
    category: '3d',
    description: '3D модели из текста',
    enhancementRules: [
      'Указывать тип модели (character, object, environment)',
      'Описывать форму и пропорции',
      'Указывать стиль (realistic, stylized, low-poly)',
      'Добавлять детали текстур',
      'Указывать предназначение (game asset, 3D print, animation)',
      'Упоминать topology (quad-based, optimized)'
    ],
    template: '[Object type], [shape/proportions], [style], [texture details], [purpose]'
  }
};

module.exports = { engines };
