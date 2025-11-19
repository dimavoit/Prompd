{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // bot.js - Prompd v2.1 \uc0\u1041 \u1045 \u1047  \u1041 \u1044  (\u1074 \u1089 \u1105  \u1074  \u1087 \u1072 \u1084 \u1103 \u1090 \u1080 )\
\
require('dotenv').config();\
const TelegramBot = require('node-telegram-bot-api');\
const express = require('express');\
const \{ engines, subscriptions \} = require('./config');\
const \{ enhancePrompt, refinePrompt, formatResult \} = require('./promptEnhancer');\
\
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.OPENAI_API_KEY) \{\
  console.error('\uc0\u10060  \u1054 \u1090 \u1089 \u1091 \u1090 \u1089 \u1090 \u1074 \u1091 \u1102 \u1090  \u1087 \u1077 \u1088 \u1077 \u1084 \u1077 \u1085 \u1085 \u1099 \u1077  \u1086 \u1082 \u1088 \u1091 \u1078 \u1077 \u1085 \u1080 \u1103 ');\
  process.exit(1);\
\}\
\
// Express \uc0\u1076 \u1083 \u1103  health check\
const app = express();\
const PORT = process.env.PORT || 3000;\
\
app.get('/', (req, res) => \{\
  res.send('\uc0\u55358 \u56598  Prompd bot is running!');\
\});\
\
app.get('/health', (req, res) => \{\
  res.json(\{ \
    status: 'ok',\
    uptime: Math.floor(process.uptime()),\
    timestamp: new Date().toISOString()\
  \});\
\});\
\
app.listen(PORT, () => \{\
  console.log(`\uc0\u55356 \u57104  Web server on port $\{PORT\}`);\
\});\
\
// \uc0\u1041 \u1044  \u1074  \u1087 \u1072 \u1084 \u1103 \u1090 \u1080 \
const users = new Map(); // userId -> \{subscription, dailyCount, resetAt\}\
const userState = new Map(); // userId -> \{engine, lastPrompt, waitingRefinement\}\
\
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, \{ polling: true \});\
\
console.log('\uc0\u55358 \u56598  \u1041 \u1086 \u1090  \u1079 \u1072 \u1087 \u1091 \u1097 \u1077 \u1085 !');\
\
// \uc0\u1060 \u1091 \u1085 \u1082 \u1094 \u1080 \u1080  \u1076 \u1083 \u1103  \u1088 \u1072 \u1073 \u1086 \u1090 \u1099  \u1089  \u1087 \u1086 \u1083 \u1100 \u1079 \u1086 \u1074 \u1072 \u1090 \u1077 \u1083 \u1103 \u1084 \u1080 \
function getUser(userId) \{\
  if (!users.has(userId)) \{\
    users.set(userId, \{\
      subscription: 'FREE',\
      dailyCount: 0,\
      resetAt: new Date()\
    \});\
  \}\
  return users.get(userId);\
\}\
\
function checkLimit(userId) \{\
  const user = getUser(userId);\
  \
  if (user.subscription === 'PRO') \{\
    return \{ ok: true, remaining: 999 \};\
  \}\
  \
  const now = new Date();\
  if (now > user.resetAt) \{\
    const tomorrow = new Date(now);\
    tomorrow.setDate(tomorrow.getDate() + 1);\
    tomorrow.setHours(0, 0, 0, 0);\
    user.dailyCount = 0;\
    user.resetAt = tomorrow;\
  \}\
  \
  const remaining = Math.max(0, 3 - user.dailyCount);\
  return \{ ok: remaining > 0, remaining \};\
\}\
\
function incrementUsage(userId) \{\
  const user = getUser(userId);\
  user.dailyCount++;\
\}\
\
function setSubscription(userId, type) \{\
  const user = getUser(userId);\
  user.subscription = type;\
\}\
\
// \uc0\u1050 \u1083 \u1072 \u1074 \u1080 \u1072 \u1090 \u1091 \u1088 \u1099 \
function createEngineKeyboard() \{\
  const imageEngines = [];\
  const videoEngines = [];\
  const other = [];\
  \
  Object.keys(engines).forEach(key => \{\
    const engine = engines[key];\
    const btn = \{\
      text: `$\{engine.icon\} $\{engine.name\}`,\
      callback_data: `engine_$\{key\}`\
    \};\
    \
    if (engine.category === 'image') imageEngines.push([btn]);\
    else if (engine.category === 'video') videoEngines.push([btn]);\
    else other.push([btn]);\
  \});\
  \
  return \{ inline_keyboard: [...imageEngines, ...videoEngines, ...other] \};\
\}\
\
function createResultButtons() \{\
  return \{\
    inline_keyboard: [[\
      \{ text: '\uc0\u55357 \u56580  \u1044 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1072 \u1090 \u1100 ', callback_data: 'refine' \},\
      \{ text: '\uc0\u10145 \u65039  \u1053 \u1086 \u1074 \u1099 \u1081 ', callback_data: 'new' \}\
    ]]\
  \};\
\}\
\
// \uc0\u1050 \u1086 \u1084 \u1072 \u1085 \u1076 \u1099 \
bot.onText(/\\/start/, (msg) => \{\
  const name = msg.from.first_name || '\uc0\u1076 \u1088 \u1091 \u1075 ';\
  \
  const text = `\uc0\u55357 \u56395  \u1055 \u1088 \u1080 \u1074 \u1077 \u1090 , $\{name\}!\
\
\uc0\u1071  *Prompd* - \u1091 \u1083 \u1091 \u1095 \u1096 \u1072 \u1102  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1099  \u1076 \u1083 \u1103  AI.\
\
\uc0\u55356 \u57263  *\u1050 \u1072 \u1082  \u1088 \u1072 \u1073 \u1086 \u1090 \u1072 \u1077 \u1090 :*\
1. /select - \uc0\u1074 \u1099 \u1073 \u1077 \u1088 \u1080  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 \
2. \uc0\u1053 \u1072 \u1087 \u1080 \u1096 \u1080  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \
3. \uc0\u1055 \u1086 \u1083 \u1091 \u1095 \u1080  \u1091 \u1083 \u1091 \u1095 \u1096 \u1077 \u1085 \u1085 \u1099 \u1081 \
4. \uc0\u1044 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1072 \u1081  \u1077 \u1089 \u1083 \u1080  \u1085 \u1091 \u1078 \u1085 \u1086 \
\
\uc0\u55356 \u56723  *Free:* 3 \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1072 /\u1076 \u1077 \u1085 \u1100 \
\uc0\u11088  *PRO:* \u1073 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090  (990\u8381 /\u1084 \u1077 \u1089 )\
\
\uc0\u1053 \u1072 \u1095 \u1085 \u1080  \u1089  /select! \u55357 \u56960 `;\
\
  bot.sendMessage(msg.chat.id, text, \{ parse_mode: 'Markdown' \});\
\});\
\
bot.onText(/\\/help/, (msg) => \{\
  const text = `\uc0\u55357 \u56534  *\u1050 \u1086 \u1084 \u1072 \u1085 \u1076 \u1099 :*\
\
/start - \uc0\u1053 \u1072 \u1095 \u1072 \u1090 \u1100 \
/select - \uc0\u1042 \u1099 \u1073 \u1088 \u1072 \u1090 \u1100  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 \
/subscribe - \uc0\u1055 \u1086 \u1076 \u1087 \u1080 \u1089 \u1082 \u1072  PRO\
/status - \uc0\u1058 \u1074 \u1086 \u1081  \u1089 \u1090 \u1072 \u1090 \u1091 \u1089 \
/help - \uc0\u1057 \u1087 \u1088 \u1072 \u1074 \u1082 \u1072 `;\
\
  bot.sendMessage(msg.chat.id, text, \{ parse_mode: 'Markdown' \});\
\});\
\
bot.onText(/\\/select/, (msg) => \{\
  bot.sendMessage(msg.chat.id, '\uc0\u55356 \u57263  *\u1042 \u1099 \u1073 \u1077 \u1088 \u1080  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 :*', \{\
    parse_mode: 'Markdown',\
    reply_markup: createEngineKeyboard()\
  \});\
\});\
\
bot.onText(/\\/status/, (msg) => \{\
  const chatId = msg.chat.id;\
  const user = getUser(chatId);\
  const limit = checkLimit(chatId);\
  \
  let text = `\uc0\u55357 \u56522  *\u1058 \u1074 \u1086 \u1081  \u1089 \u1090 \u1072 \u1090 \u1091 \u1089 :*\\n\\n\u1055 \u1086 \u1076 \u1087 \u1080 \u1089 \u1082 \u1072 : *$\{user.subscription\}*\\n`;\
  \
  if (user.subscription === 'FREE') \{\
    text += `\uc0\u1054 \u1089 \u1090 \u1072 \u1083 \u1086 \u1089 \u1100  \u1089 \u1077 \u1075 \u1086 \u1076 \u1085 \u1103 : *$\{limit.remaining\}/3*\\n\\n`;\
    text += `\uc0\u55357 \u56462  \u1061 \u1086 \u1095 \u1077 \u1096 \u1100  \u1073 \u1086 \u1083 \u1100 \u1096 \u1077 ? /subscribe`;\
  \} else \{\
    text += `\uc0\u10024  \u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1099 \\n\u10024  \u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1082 \u1080 `;\
  \}\
  \
  bot.sendMessage(chatId, text, \{ parse_mode: 'Markdown' \});\
\});\
\
bot.onText(/\\/subscribe/, (msg) => \{\
  const text = `\uc0\u55357 \u56462  *\u1055 \u1086 \u1076 \u1087 \u1080 \u1089 \u1082 \u1072  PRO*\
\
\uc0\u11088  *990 \u8381 /\u1084 \u1077 \u1089 *\
\uc0\u9989  \u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1099 \
\uc0\u9989  \u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1082 \u1080 \
\uc0\u9989  \u1042 \u1089 \u1077  \u1076 \u1074 \u1080 \u1078 \u1082 \u1080 \
\
\uc0\u1053 \u1072 \u1078 \u1084 \u1080  \u1082 \u1085 \u1086 \u1087 \u1082 \u1091  \u1076 \u1083 \u1103  \u1086 \u1087 \u1083 \u1072 \u1090 \u1099 :`;\
\
  const keyboard = \{\
    inline_keyboard: [[\
      \{ text: '\uc0\u11088  \u1054 \u1087 \u1083 \u1072 \u1090 \u1080 \u1090 \u1100  990\u8381 ', callback_data: 'pay_pro' \}\
    ]]\
  \};\
\
  bot.sendMessage(msg.chat.id, text, \{\
    parse_mode: 'Markdown',\
    reply_markup: keyboard\
  \});\
\});\
\
bot.onText(/\\/info/, (msg) => \{\
  const chatId = msg.chat.id;\
  const state = userState.get(chatId);\
  \
  if (!state || !state.engine) \{\
    bot.sendMessage(chatId, '\uc0\u9888 \u65039  \u1057 \u1085 \u1072 \u1095 \u1072 \u1083 \u1072  /select');\
    return;\
  \}\
  \
  const engine = engines[state.engine];\
  let text = `$\{engine.icon\} *$\{engine.name\}*\\n\\n$\{engine.description\}\\n\\n`;\
  \
  if (engine.maxLength) \{\
    text += `\uc0\u9201 \u65039  $\{engine.maxLength\}\\n\\n`;\
  \}\
  \
  text += `\uc0\u55357 \u56481  *\u1054 \u1089 \u1086 \u1073 \u1077 \u1085 \u1085 \u1086 \u1089 \u1090 \u1080 :*\\n`;\
  engine.enhancementRules.slice(0, 3).forEach((rule, i) => \{\
    text += `$\{i + 1\}. $\{rule\}\\n`;\
  \});\
  \
  bot.sendMessage(chatId, text, \{ parse_mode: 'Markdown' \});\
\});\
\
// \uc0\u1055 \u1083 \u1072 \u1090 \u1077 \u1078 \u1080 \
bot.on('pre_checkout_query', (query) => \{\
  bot.answerPreCheckoutQuery(query.id, true);\
\});\
\
bot.on('successful_payment', (msg) => \{\
  const chatId = msg.chat.id;\
  setSubscription(chatId, 'PRO');\
  \
  bot.sendMessage(chatId,\
    '\uc0\u9989  *\u1057 \u1087 \u1072 \u1089 \u1080 \u1073 \u1086  \u1079 \u1072  \u1087 \u1086 \u1076 \u1087 \u1080 \u1089 \u1082 \u1091 !*\\n\\n' +\
    '\uc0\u10024  \u1058 \u1077 \u1087 \u1077 \u1088 \u1100  \u1073 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1099 \\n' +\
    '\uc0\u10024  \u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1082 \u1080 \\n\\n' +\
    '\uc0\u1053 \u1072 \u1095 \u1085 \u1080  \u1089  /select \u55357 \u56960 ',\
    \{ parse_mode: 'Markdown' \}\
  );\
\});\
\
// Callbacks\
bot.on('callback_query', async (query) => \{\
  const chatId = query.message.chat.id;\
  const data = query.data;\
  \
  try \{\
    if (data.startsWith('engine_')) \{\
      const engineKey = data.replace('engine_', '');\
      const engine = engines[engineKey];\
      \
      if (!engine) \{\
        await bot.answerCallbackQuery(query.id, \{ text: '\uc0\u10060  \u1054 \u1096 \u1080 \u1073 \u1082 \u1072 ' \});\
        return;\
      \}\
      \
      userState.set(chatId, \{ \
        engine: engineKey,\
        lastPrompt: null,\
        waitingRefinement: false\
      \});\
      \
      await bot.answerCallbackQuery(query.id, \{ text: `\uc0\u9989  $\{engine.name\}` \});\
      \
      await bot.editMessageText(\
        `\uc0\u9989  *$\{engine.icon\} $\{engine.name\}*\\n\\n$\{engine.description\}\\n\\n\u1054 \u1090 \u1087 \u1088 \u1072 \u1074 \u1100  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 ! \u55357 \u56960 `,\
        \{\
          chat_id: chatId,\
          message_id: query.message.message_id,\
          parse_mode: 'Markdown'\
        \}\
      );\
    \}\
    \
    else if (data === 'refine') \{\
      await bot.answerCallbackQuery(query.id);\
      \
      const state = userState.get(chatId);\
      if (!state || !state.lastPrompt) \{\
        bot.sendMessage(chatId, '\uc0\u10060  \u1053 \u1077 \u1090  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1072  \u1076 \u1083 \u1103  \u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1082 \u1080 ');\
        return;\
      \}\
      \
      state.waitingRefinement = true;\
      userState.set(chatId, state);\
      \
      bot.sendMessage(chatId,\
        '\uc0\u55357 \u56541  *\u1063 \u1090 \u1086  \u1080 \u1079 \u1084 \u1077 \u1085 \u1080 \u1090 \u1100 ?*\\n\\n_\u1053 \u1072 \u1087 \u1088 \u1080 \u1084 \u1077 \u1088 : "\u1076 \u1086 \u1073 \u1072 \u1074 \u1100  \u1073 \u1086 \u1083 \u1100 \u1096 \u1077  \u1076 \u1077 \u1090 \u1072 \u1083 \u1077 \u1081 "_',\
        \{ parse_mode: 'Markdown' \}\
      );\
    \}\
    \
    else if (data === 'new') \{\
      await bot.answerCallbackQuery(query.id);\
      \
      const state = userState.get(chatId);\
      if (state) \{\
        state.lastPrompt = null;\
        state.waitingRefinement = false;\
        userState.set(chatId, state);\
      \}\
      \
      bot.sendMessage(chatId, '\uc0\u55356 \u57263  *\u1042 \u1099 \u1073 \u1077 \u1088 \u1080  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 :*', \{\
        parse_mode: 'Markdown',\
        reply_markup: createEngineKeyboard()\
      \});\
    \}\
    \
    else if (data === 'pay_pro') \{\
      await bot.sendInvoice(chatId, \{\
        title: 'PRO \uc0\u1087 \u1086 \u1076 \u1087 \u1080 \u1089 \u1082 \u1072 ',\
        description: '\uc0\u1041 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1085 \u1099 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1099  \u1085 \u1072  \u1084 \u1077 \u1089 \u1103 \u1094 ',\
        payload: 'pro_sub',\
        provider_token: '',\
        currency: 'XTR',\
        prices: [\{ label: 'PRO', amount: 99000 \}]\
      \}).catch(err => \{\
        console.error('Invoice error:', err);\
        bot.sendMessage(chatId, '\uc0\u10060  \u1054 \u1096 \u1080 \u1073 \u1082 \u1072  \u1087 \u1083 \u1072 \u1090 \u1077 \u1078 \u1072 . \u1055 \u1086 \u1087 \u1088 \u1086 \u1073 \u1091 \u1081  \u1087 \u1086 \u1079 \u1078 \u1077 ');\
      \});\
    \}\
    \
  \} catch (error) \{\
    console.error('Callback error:', error);\
  \}\
\});\
\
// \uc0\u1057 \u1086 \u1086 \u1073 \u1097 \u1077 \u1085 \u1080 \u1103 \
bot.on('message', async (msg) => \{\
  const chatId = msg.chat.id;\
  const text = msg.text;\
  \
  if (!text || text.startsWith('/') || msg.successful_payment) \{\
    return;\
  \}\
  \
  try \{\
    const state = userState.get(chatId);\
    \
    if (!state || !state.engine) \{\
      bot.sendMessage(chatId, '\uc0\u9888 \u65039  \u1057 \u1085 \u1072 \u1095 \u1072 \u1083 \u1072  /select');\
      return;\
    \}\
    \
    const user = getUser(chatId);\
    \
    if (user.subscription === 'FREE' && !state.waitingRefinement) \{\
      const limit = checkLimit\
const limit = checkLimit(chatId);\
      if (!limit.ok) \{\
        bot.sendMessage(chatId,\
          '\uc0\u10060  \u1051 \u1080 \u1084 \u1080 \u1090  \u1080 \u1089 \u1095 \u1077 \u1088 \u1087 \u1072 \u1085  (3/\u1076 \u1077 \u1085 \u1100 )\\n\\n\u55357 \u56462  /subscribe \u1076 \u1083 \u1103  \u1073 \u1077 \u1079 \u1083 \u1080 \u1084 \u1080 \u1090 \u1072 ',\
          \{ parse_mode: 'Markdown' \}\
        );\
        return;\
      \}\
    \}\
    \
    const processing = await bot.sendMessage(chatId, '\uc0\u9203  \u1054 \u1073 \u1088 \u1072 \u1073 \u1072 \u1090 \u1099 \u1074 \u1072 \u1102 ...');\
    \
    let result;\
    \
    if (state.waitingRefinement && state.lastPrompt) \{\
      result = await refinePrompt(state.lastPrompt, text, state.engine);\
      state.waitingRefinement = false;\
    \} else \{\
      result = await enhancePrompt(text, state.engine);\
    \}\
    \
    if (!result.success) \{\
      await bot.editMessageText(`\uc0\u10060  $\{result.error\}`, \{\
        chat_id: chatId,\
        message_id: processing.message_id\
      \});\
      return;\
    \}\
    \
    state.lastPrompt = result.enhanced;\
    userState.set(chatId, state);\
    \
    const formatted = formatResult(result);\
    await bot.editMessageText(formatted, \{\
      chat_id: chatId,\
      message_id: processing.message_id,\
      parse_mode: 'Markdown'\
    \});\
    \
    await bot.sendMessage(chatId, '\uc0\u55357 \u56481  \u1063 \u1090 \u1086  \u1076 \u1072 \u1083 \u1100 \u1096 \u1077 ?', \{\
      reply_markup: createResultButtons()\
    \});\
    \
    if (user.subscription === 'FREE' && !state.waitingRefinement) \{\
      incrementUsage(chatId);\
    \}\
    \
  \} catch (error) \{\
    console.error('Message error:', error);\
    bot.sendMessage(chatId, '\uc0\u10060  \u1054 \u1096 \u1080 \u1073 \u1082 \u1072 . \u1055 \u1086 \u1087 \u1088 \u1086 \u1073 \u1091 \u1081  \u1087 \u1086 \u1079 \u1078 \u1077 ');\
  \}\
\});\
\
bot.on('polling_error', (error) => \{\
  console.error('Polling error:', error);\
\});\
\
console.log('\uc0\u9989  Prompd v2.1 \u1075 \u1086 \u1090 \u1086 \u1074 !');}