# 峰哥聊天机器人 — 设计文档

## 概述

基于 DeepSeek v4 + 峰哥亡命天涯 skill 的网页聊天机器人。用户输入消息 → 后端拼装峰哥人设 system prompt → DeepSeek 流式生成文本 → Fish Audio 峰哥音色 TTS 朗读。前端 React，后端 Node.js/Express，API Key 由后端代理不暴露。

## 架构

```
浏览器 (React + Vite)
  ↕ HTTP + SSE 流式
Node.js Express 后端 (server/)
  ↕ API 调用
DeepSeek API (chat/completions)  +  Fish Audio API (TTS)
```

### 数据流

1. 用户输入 → POST `/api/chat` 带对话历史
2. 后端插入 system message（峰哥人设）→ 调 DeepSeek `stream: true` → SSE 逐块转发前端
3. 文本生成完毕 → 前端拿完整文本调 POST `/api/tts` → 后端调 Fish Audio → 返回 audio/mpeg
4. 前端自动播放音频（全局开关可控），每条消息可手动重播

## 项目结构

```
fengge-chat/
├── server/
│   ├── index.js              # Express 入口, CORS, 静态文件
│   ├── routes/
│   │   ├── chat.js           # POST /api/chat - DeepSeek SSE 流式代理
│   │   └── tts.js            # POST /api/tts  - Fish Audio 代理
│   ├── prompts/
│   │   └── fengge.js         # 峰哥 system prompt（5 文件结构化拼接）
│   └── .env                  # DEEPSEEK_API_KEY, FISH_AUDIO_API_KEY 等
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx    # 消息列表容器, 自动滚底
│   │   │   ├── MessageBubble.jsx # 单条消息: 头像 + 文本 + 播放按钮
│   │   │   ├── ChatInput.jsx     # 输入框 + 发送按钮
│   │   │   └── AudioToggle.jsx   # 语音自动播放开关
│   │   ├── hooks/
│   │   │   ├── useChat.js        # 聊天状态管理 + SSE 消费
│   │   │   └── useAudio.js       # 音频播放 + 全局开关
│   │   └── utils/
│   │       └── storage.js        # localStorage 读写, 200条上限
│   └── vite.config.js        # 含 proxy 配置, 开发时 /api 转发到 Express
└── package.json              # 根目录, concurrently 同时启动 server 和 client
```

## 组件设计

### App.jsx
- 顶层状态: `audioEnabled`, `messages`, `isStreaming`
- 布局: 顶部 AudioToggle + 中间 ChatWindow + 底部 ChatInput

### ChatWindow.jsx
- props: `messages`, `isStreaming`
- 渲染消息列表，用户消息右对齐，峰哥消息左对齐（带峰哥标识）
- 流式输出时最后一条消息实时追加文本
- useEffect 新消息自动 scrollToBottom

### MessageBubble.jsx
- props: `message`, `audioEnabled`, `onPlay`
- 用户气泡: 右对齐，纯色底
- 峰哥气泡: 左对齐，带"峰哥"头像占位 + 播放按钮
- 播放按钮: 点击调 useAudio 播放，加载中显示 loading

### ChatInput.jsx
- props: `onSend`, `disabled`
- Enter 发送, Shift+Enter 换行
- 发送中禁用输入框和按钮

### AudioToggle.jsx
- props: `enabled`, `onToggle`
- 开关组件，状态持久化到 localStorage key `fengge-audio-enabled`

## 状态管理

### useChat hook
```js
{
  messages: [{ id, role: 'user'|'assistant', content, audioUrl?, timestamp }],
  isStreaming: boolean,
  sendMessage(text),
  clearHistory()
}
```
- `sendMessage`: 拼接 messages → POST /api/chat → 读 SSE ReadableStream → 逐 chunk 追加到最后一条 assistant message → stream 结束拿到完整文本 → POST /api/tts 获取 audioUrl（仅内存，不持久化）
- 初始化时从 localStorage key `fengge-chat-history` 恢复
- 每次 messages 变化写入 localStorage（写入时剥离 audioUrl，临时 URL 不持久化）

### useAudio hook
```js
{
  play(url),
  stop(),
  isPlaying,
  audioEnabled,
  toggleAudio()
}
```
- `play`: 创建 Audio 对象播放，播放完自动释放
- `toggleAudio`: 切换并写入 localStorage key `fengge-audio-enabled`

## 后端 API

### POST /api/chat
- 请求: `{ messages: [{ role, content }] }`
- 在 messages 数组头部插入 system message（由 prompts/fengge.js 生成）
- 调用 DeepSeek `/chat/completions`, `stream: true`
- 设置响应头 `Content-Type: text/event-stream`
- SSE 事件格式:
  ```
  data: {"type":"delta","content":"兄弟"}
  data: {"type":"done","messageId":"xxx"}
  data: {"type":"error","message":"..."}
  ```

### POST /api/tts
- 请求: `{ text: "完整回复文本" }`
- 调用 Fish Audio TTS API，传入峰哥 voice_id
- 响应: `audio/mpeg` 二进制流

## System Prompt 构建 (prompts/fengge.js)

从 skill 文件夹的 5 个文件中提取素材，结构化拼接为一条 system message，目标 2000-3000 token。

### 拼接结构

1. **身份卡（虚构版）** — 来自 SKILL.md + 01-public-research.md
2. **核心表达模型（5 个）** — 来自 SKILL.md: 先结论后解释 / 好事辩证反转 / 现实主义去魅 / 直球追问拆穿 / 开放式收尾
3. **语言风格调音台** — 来自 02-dialogue-templates.md + 04-live-clip-quotes.md: 称呼体系、节奏规则、高频口头禅精选 10-15 条
4. **场景应答模式** — 来自 SKILL.md + 02: 情感/职场/漂泊/兄弟/整活，每种的结构模板
5. **Few-shot 示例（6 条）** — 从 02 的 12 条中精选，覆盖不同场景
6. **安全边界（硬规则）** — 来自 03-safety-and-boundaries.md: 红线清单、拒答话术、安全替换词库

### 输出格式硬约束（拼入 system prompt 末尾）

- 纯口语对话，禁止 markdown 符号（#, *, -, `, >, 序号等）
- 禁止情绪标签（[生气][疑惑][流泪]等）
- 禁止 emoji
- 禁止列表式建议（"第一...第二...第三..."）
- 只能像两人酒桌聊天一样用自然段落说话
- 短句、大白话、停顿词可保留，但这是口语节奏不是格式

## 持久化

- `fengge-chat-history`: 消息数组 JSON, 最多 200 条
- `fengge-audio-enabled`: 布尔值, 语音开关状态
- 均使用 localStorage, 页面刷新不丢

## 语音播放逻辑

1. 用户发送消息 → 流式文本生成完毕 → 自动调 TTS 获取音频
2. 如果 `audioEnabled === true`, 拿到音频自动播放
3. 如果 `audioEnabled === false`, 不自动播放，但显示播放按钮可手动播
4. 每条消息的音频只请求一次（首次需要时），缓存在 message.audioUrl

## 开发环境

- Vite dev server 端口 5173, Express 端口 3001
- Vite proxy 配置: `/api` 开头的请求转发到 `http://localhost:3001`
- 根 package.json 使用 `concurrently` 同时启动 server 和 client
- 生产环境: Express 直接 serve client 的 dist 目录

## 技术约束

- 前端: React 18 + Vite
- 后端: Express, 使用原生 fetch (Node 18+) 调外部 API
- 不引入数据库，不引入状态管理库
- API Key 全部在 server/.env，不进入前端代码
