{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // promptEnhancer.js - \uc0\u1059 \u1083 \u1091 \u1095 \u1096 \u1077 \u1085 \u1080 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1086 \u1074  v2.1\
\
const OpenAI = require('openai');\
const \{ engines \} = require('./config');\
\
const openai = new OpenAI(\{\
  apiKey: process.env.OPENAI_API_KEY\
\});\
\
function detectLanguage(text) \{\
  const cyrillicPattern = /[\uc0\u1072 -\u1103 \u1040 -\u1071 \u1105 \u1025 ]/;\
  return cyrillicPattern.test(text) ? 'ru' : 'en';\
\}\
\
async function enhancePrompt(userPrompt, engineKey) \{\
  const engine = engines[engineKey];\
  \
  if (!engine) \{\
    throw new Error(`\uc0\u1053 \u1077 \u1080 \u1079 \u1074 \u1077 \u1089 \u1090 \u1085 \u1099 \u1081  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 : $\{engineKey\}`);\
  \}\
\
  const userLanguage = detectLanguage(userPrompt);\
  \
  const systemPrompt = `\uc0\u1058 \u1099  \u1101 \u1082 \u1089 \u1087 \u1077 \u1088 \u1090  \u1087 \u1086  \u1089 \u1086 \u1079 \u1076 \u1072 \u1085 \u1080 \u1102  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1086 \u1074  \u1076 \u1083 \u1103  $\{engine.name\}.\
\
\uc0\u1048 \u1053 \u1060 \u1054 \u1056 \u1052 \u1040 \u1062 \u1048 \u1071  \u1054  \u1044 \u1042 \u1048 \u1046 \u1050 \u1045 :\
\uc0\u1053 \u1072 \u1079 \u1074 \u1072 \u1085 \u1080 \u1077 : $\{engine.name\}\
\uc0\u1050 \u1072 \u1090 \u1077 \u1075 \u1086 \u1088 \u1080 \u1103 : $\{engine.category\}\
\uc0\u1054 \u1087 \u1080 \u1089 \u1072 \u1085 \u1080 \u1077 : $\{engine.description\}\
$\{engine.maxLength ? `\uc0\u1052 \u1072 \u1082 \u1089 \u1080 \u1084 \u1072 \u1083 \u1100 \u1085 \u1072 \u1103  \u1076 \u1083 \u1080 \u1085 \u1072 : $\{engine.maxLength\}` : ''\}\
$\{engine.template ? `\uc0\u1056 \u1077 \u1082 \u1086 \u1084 \u1077 \u1085 \u1076 \u1091 \u1077 \u1084 \u1072 \u1103  \u1089 \u1090 \u1088 \u1091 \u1082 \u1090 \u1091 \u1088 \u1072 : $\{engine.template\}` : ''\}\
$\{engine.parameters ? `\uc0\u1044 \u1086 \u1089 \u1090 \u1091 \u1087 \u1085 \u1099 \u1077  \u1087 \u1072 \u1088 \u1072 \u1084 \u1077 \u1090 \u1088 \u1099 : $\{engine.parameters.join(', ')\}` : ''\}\
\
\uc0\u1055 \u1056 \u1040 \u1042 \u1048 \u1051 \u1040  \u1059 \u1051 \u1059 \u1063 \u1064 \u1045 \u1053 \u1048 \u1071  \u1055 \u1056 \u1054 \u1052 \u1055 \u1058 \u1040 :\
$\{engine.enhancementRules.map((rule, i) => `$\{i + 1\}. $\{rule\}`).join('\\n')\}\
\
\uc0\u1058 \u1042 \u1054 \u1071  \u1047 \u1040 \u1044 \u1040 \u1063 \u1040 :\
1. \uc0\u1055 \u1086 \u1083 \u1100 \u1079 \u1086 \u1074 \u1072 \u1090 \u1077 \u1083 \u1100  \u1085 \u1072 \u1087 \u1080 \u1089 \u1072 \u1083  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090  \u1085 \u1072  $\{userLanguage === 'ru' ? '\u1088 \u1091 \u1089 \u1089 \u1082 \u1086 \u1084 ' : '\u1072 \u1085 \u1075 \u1083 \u1080 \u1081 \u1089 \u1082 \u1086 \u1084 '\} \u1103 \u1079 \u1099 \u1082 \u1077 \
2. \uc0\u1059 \u1083 \u1091 \u1095 \u1096 \u1080  \u1101 \u1090 \u1086 \u1090  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090  \u1089 \u1086 \u1075 \u1083 \u1072 \u1089 \u1085 \u1086  \u1087 \u1088 \u1072 \u1074 \u1080 \u1083 \u1072 \u1084  \u1074 \u1099 \u1096 \u1077  \u1076 \u1083 \u1103  $\{engine.name\}\
3. \uc0\u1042 \u1077 \u1088 \u1085 \u1080  \u1088 \u1077 \u1079 \u1091 \u1083 \u1100 \u1090 \u1072 \u1090  \u1057 \u1058 \u1056 \u1054 \u1043 \u1054  \u1074  JSON \u1092 \u1086 \u1088 \u1084 \u1072 \u1090 \u1077 :\
\
\{\
  "enhanced_prompt": "\uc0\u1091 \u1083 \u1091 \u1095 \u1096 \u1077 \u1085 \u1085 \u1099 \u1081  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090  \u1085 \u1072  \u1072 \u1085 \u1075 \u1083 \u1080 \u1081 \u1089 \u1082 \u1086 \u1084  \u1103 \u1079 \u1099 \u1082 \u1077 ",\
  "translation_ru": "\uc0\u1087 \u1077 \u1088 \u1077 \u1074 \u1086 \u1076  \u1085 \u1072  \u1088 \u1091 \u1089 \u1089 \u1082 \u1080 \u1081  \u1076 \u1083 \u1103  \u1087 \u1086 \u1085 \u1080 \u1084 \u1072 \u1085 \u1080 \u1103 "\
\}\
\
\uc0\u1042 \u1040 \u1046 \u1053 \u1054 :\
- enhanced_prompt \uc0\u1042 \u1057 \u1045 \u1043 \u1044 \u1040  \u1085 \u1072  \u1072 \u1085 \u1075 \u1083 \u1080 \u1081 \u1089 \u1082 \u1086 \u1084 \
- translation_ru - \uc0\u1101 \u1090 \u1086  \u1087 \u1077 \u1088 \u1077 \u1074 \u1086 \u1076  enhanced_prompt \u1085 \u1072  \u1088 \u1091 \u1089 \u1089 \u1082 \u1080 \u1081 \
- \uc0\u1041 \u1091 \u1076 \u1100  \u1082 \u1088 \u1072 \u1090 \u1082 \u1080 \u1084  \u1080  \u1089 \u1090 \u1088 \u1091 \u1082 \u1090 \u1091 \u1088 \u1080 \u1088 \u1086 \u1074 \u1072 \u1085 \u1085 \u1099 \u1084 \
- \uc0\u1057 \u1086 \u1093 \u1088 \u1072 \u1085 \u1103 \u1081  \u1086 \u1089 \u1085 \u1086 \u1074 \u1085 \u1091 \u1102  \u1080 \u1076 \u1077 \u1102  \u1087 \u1086 \u1083 \u1100 \u1079 \u1086 \u1074 \u1072 \u1090 \u1077 \u1083 \u1103 `;\
\
  try \{\
    const completion = await openai.chat.completions.create(\{\
      model: 'gpt-4o-mini',\
      messages: [\
        \{ role: 'system', content: systemPrompt \},\
        \{ role: 'user', content: userPrompt \}\
      ],\
      temperature: 0.7,\
      max_tokens: 800,\
      response_format: \{ type: "json_object" \}\
    \});\
\
    const result = JSON.parse(completion.choices[0].message.content);\
    \
    return \{\
      success: true,\
      enhanced: result.enhanced_prompt,\
      translation: result.translation_ru,\
      engine: engine.name,\
      engineIcon: engine.icon\
    \};\
\
  \} catch (error) \{\
    console.error('Error enhancing prompt:', error);\
    return \{\
      success: false,\
      error: '\uc0\u1054 \u1096 \u1080 \u1073 \u1082 \u1072  \u1087 \u1088 \u1080  \u1091 \u1083 \u1091 \u1095 \u1096 \u1077 \u1085 \u1080 \u1080  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1072 '\
    \};\
  \}\
\}\
\
async function refinePrompt(currentPrompt, userRequest, engineKey) \{\
  const engine = engines[engineKey];\
  \
  if (!engine) \{\
    throw new Error(`\uc0\u1053 \u1077 \u1080 \u1079 \u1074 \u1077 \u1089 \u1090 \u1085 \u1099 \u1081  \u1076 \u1074 \u1080 \u1078 \u1086 \u1082 : $\{engineKey\}`);\
  \}\
\
  const systemPrompt = `\uc0\u1058 \u1099  \u1101 \u1082 \u1089 \u1087 \u1077 \u1088 \u1090  \u1087 \u1086  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1072 \u1084  \u1076 \u1083 \u1103  $\{engine.name\}.\
\
\uc0\u1058 \u1045 \u1050 \u1059 \u1065 \u1048 \u1049  \u1055 \u1056 \u1054 \u1052 \u1055 \u1058 :\
$\{currentPrompt\}\
\
\uc0\u1047 \u1040 \u1055 \u1056 \u1054 \u1057  \u1055 \u1054 \u1051 \u1068 \u1047 \u1054 \u1042 \u1040 \u1058 \u1045 \u1051 \u1071 :\
$\{userRequest\}\
\
\uc0\u1044 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1072 \u1081  \u1090 \u1077 \u1082 \u1091 \u1097 \u1080 \u1081  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090  \u1089 \u1086 \u1075 \u1083 \u1072 \u1089 \u1085 \u1086  \u1087 \u1088 \u1086 \u1089 \u1100 \u1073 \u1077  \u1087 \u1086 \u1083 \u1100 \u1079 \u1086 \u1074 \u1072 \u1090 \u1077 \u1083 \u1103 .\
\uc0\u1057 \u1086 \u1093 \u1088 \u1072 \u1085 \u1080  \u1082 \u1072 \u1095 \u1077 \u1089 \u1090 \u1074 \u1086  \u1080  \u1089 \u1090 \u1088 \u1091 \u1082 \u1090 \u1091 \u1088 \u1091 .\
\
\uc0\u1042 \u1077 \u1088 \u1085 \u1080  JSON:\
\{\
  "enhanced_prompt": "\uc0\u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1072 \u1085 \u1085 \u1099 \u1081  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090  \u1085 \u1072  \u1072 \u1085 \u1075 \u1083 \u1080 \u1081 \u1089 \u1082 \u1086 \u1084 ",\
  "translation_ru": "\uc0\u1087 \u1077 \u1088 \u1077 \u1074 \u1086 \u1076  \u1085 \u1072  \u1088 \u1091 \u1089 \u1089 \u1082 \u1080 \u1081 "\
\}`;\
\
  try \{\
    const completion = await openai.chat.completions.create(\{\
      model: 'gpt-4o-mini',\
      messages: [\
        \{ role: 'system', content: systemPrompt \},\
        \{ role: 'user', content: userRequest \}\
      ],\
      temperature: 0.7,\
      max_tokens: 800,\
      response_format: \{ type: "json_object" \}\
    \});\
\
    const result = JSON.parse(completion.choices[0].message.content);\
    \
    return \{\
      success: true,\
      enhanced: result.enhanced_prompt,\
      translation: result.translation_ru,\
      engine: engine.name,\
      engineIcon: engine.icon\
    \};\
\
  \} catch (error) \{\
    console.error('Error refining prompt:', error);\
    return \{\
      success: false,\
      error: '\uc0\u1054 \u1096 \u1080 \u1073 \u1082 \u1072  \u1087 \u1088 \u1080  \u1076 \u1086 \u1088 \u1072 \u1073 \u1086 \u1090 \u1082 \u1077  \u1087 \u1088 \u1086 \u1084 \u1087 \u1090 \u1072 '\
    \};\
  \}\
\}\
\
function formatResult(result) \{\
  if (!result.success) \{\
    return `\uc0\u10060  $\{result.error\}`;\
  \}\
\
  let message = `$\{result.engineIcon\} *$\{result.engine\}*\\n\\n`;\
  message += `\uc0\u10024  *Enhanced:*\\n\\`\\`\\`\\n$\{result.enhanced\}\\n\\`\\`\\`\\n\\n`;\
  message += `\uc0\u55357 \u56580  $\{result.translation\}`;\
  \
  return message;\
\}\
\
module.exports = \{\
  enhancePrompt,\
  refinePrompt,\
  formatResult,\
  detectLanguage\
\};}