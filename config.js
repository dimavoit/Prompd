// config.js - Конфигурация v2.1

const engines = {
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

  'firefly': {
    name: 'Adobe Firefly',
    icon: '🖼️',
    category: 'image',
    description: 'Коммерческое использование',
    enhancementRules: [
      'Указывать коммерческое назначение (marketing, advertising, branding)',
      'Описывать профессиональный стиль (corporate, modern, elegant)',
      'Добавлять требования к композиции для макетов',
      'Указывать целевую аудиторию',
      'Использовать термины дизайна (white space, hierarchy, balance)',
      'Описывать цветовую палитру конкретно'
    ],
    template: '[Commercial purpose], [professional style], [subject], [composition], [color palette], [target audience]'
  },

  'nanobanana': {
    name: 'Nanobanana (Gemini)',
    icon: '🖼️',
    category: 'image',
    description: 'Генерация через Google Gemini',
    enhancementRules: [
      'Использовать естественный язык, полные предложения',
      'Описывать контекст и сцену детально',
      'Добавлять культурные и исторические референсы',
      'Указывать технические аспекты (resolution, quality)',
      'Описывать освещение и погодные условия',
      'Использовать описательные прилагательные'
    ],
    template: '[Detailed scene description] with [cultural/historical context], [technical specs], [lighting/atmosphere]'
  },

  'flux': {
    name: 'Flux',
    icon: '🖼️',
    category: 'image',
    description: 'Реалистичные изображения',
    enhancementRules: [
      'Фокус на фотореализме и деталях',
      'Описывать материалы и текстуры детально',
      'Указывать камеру и настройки (50mm lens, f/1.8, ISO 100)',
      'Добавлять информацию о свете (natural light, soft shadows)',
      'Использовать фотографические термины',
      'Описывать глубину резкости (bokeh, sharp focus)'
    ],
    template: 'RAW photo, [subject], [camera settings], [lighting], [materials/textures], photorealistic, high detail'
  },

  'soul': {
    name: 'Higgsfield Soul',
    icon: '🖼️',
    category: 'image',
    description: 'Гиперреалистичные фото',
    enhancementRules: [
      'Детальное описание модели (возраст, внешность, позирование)',
      'Указывать стиль моды и одежду конкретно',
      'Описывать эстетику (fashion editorial, street style, haute couture)',
      'Добавлять информацию о макияже и прическе',
      'Указывать настроение и эмоции модели',
      'Использовать fashion-термины (lookbook, campaign, editorial)'
    ],
    template: '[Model description], [fashion style], [clothing details], [pose], [aesthetic], [mood], fashion photography'
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
      'Добавлять параметр -motion [1-4]',
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
    description: 'Быстрая генерация',
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

  'sora2': {
    name: 'Sora 2',
    icon: '🎦',
    category: 'video',
    maxLength: 'до 60 sec',
    description: 'OpenAI видео генерация',
    enhancementRules: [
      'Описывать полную сцену с началом и концом',
      'Добавлять повествовательную структуру (story arc)',
      'Указывать взаимодействие объектов и персонажей',
      'Описывать физику и реалистичное движение',
      'Добавлять временные маркеры (at first, then, finally)',
      'Использовать кинематографический язык'
    ],
    template: '[Scene setup], [character/object interactions], [narrative progression], [visual style], [camera work]'
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

  // 3D
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

// Настройки монетизации
const subscriptions = {
  FREE: {
    name: 'Free',
    dailyLimit: 3,
    refineLimitPerPrompt: 0,
    canUseAllEngines: true,
    maxSavedPrompts: 0,
    price: 0
  },
  PRO: {
    name: 'Pro',
    dailyLimit: null, // безлимит
    refineLimitPerPrompt: null, // безлимит
    canUseAllEngines: true,
    maxSavedPrompts: 50,
    price: 99900, // в копейках (990 руб)
    priceRub: 990,
    priceDescription: '990 ₽/мес'
  }
};

module.exports = { engines, subscriptions };