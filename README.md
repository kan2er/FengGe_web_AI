# 峰哥亡命天涯 · AI 聊天机器人

基于 DeepSeek 大模型 + 峰哥亡命天涯人设 + Fish Audio 语音克隆的 AI 聊天机器人。文字由 DeepSeek 生成具有峰哥"江湖漂泊+现实主义去魅+黑色幽默"风格的回复，语音由 Fish Audio 训练的峰哥音色模型朗读。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite |
| 后端 | Node.js + Express |
| AI 文本 | DeepSeek API（流式输出） |
| AI 语音 | Fish Audio TTS（自定义音色） |

## 前置要求

- **Node.js** >= 18
- **npm** >= 9
- DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com)）
- Fish Audio API Key + 训练好的音色 ID（[fish.audio](https://fish.audio)）
- （国内用户）需要代理访问 Fish Audio API

## 安装

```bash
# 1. 克隆项目
git clone <repo-url>
cd fengge-chat

# 2. 安装根依赖
npm install

# 3. 安装服务端依赖
cd server && npm install

# 4. 安装前端依赖
cd ../client && npm install

# 5. 回到项目根目录
cd ..
```

## 配置

```bash
# 复制配置模板
cp server/.env.example server/.env
```

编辑 `server/.env`，填入你的 API Key：

| 配置项 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | 在 DeepSeek 开放平台注册后获取 |
| `FISH_AUDIO_API_KEY` | 在 Fish Audio 控制台生成 |
| `FISH_AUDIO_VOICE_ID` | 在 Fish Audio 训练的峰哥音色模型 ID |
| `HTTPS_PROXY` | 国内访问 Fish Audio 需要代理，填写代理端口；不需要则删除 |

## 启动

```bash
# 开发模式（同时启动前后端）
npm run dev
```

启动后：
- 前端：http://localhost:5173
- 后端：http://localhost:3001

打开浏览器访问 `http://localhost:5173` 即可使用。

## 使用说明

1. 在输入框输入内容，按 Enter 发送
2. 等待峰哥回复（文本和语音会同步出现）
3. 峰哥回复右侧有播放按钮，可点击重播语音
4. 顶部开关可控制是否自动播放语音
5. 聊天记录仅在当前会话保留，刷新后清空

## 项目结构

```
fengge-chat/
├── server/                        # Node.js 服务端
│   ├── index.js                   # Express 入口，挂载路由
│   ├── routes/
│   │   ├── chat.js                # DeepSeek API 流式代理（SSE）
│   │   └── tts.js                 # Fish Audio TTS 代理
│   ├── prompts/
│   │   └── fengge.js              # 峰哥系统 Prompt（人设定义）
│   ├── package.json
│   └── .env                       # API Key 配置（不提交到 Git）
├── client/                        # React 前端
│   ├── src/
│   │   ├── App.jsx                # 主组件
│   │   ├── App.css                # 全局样式
│   │   ├── main.jsx               # 入口
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx     # 消息列表
│   │   │   ├── MessageBubble.jsx  # 单条消息气泡
│   │   │   ├── ChatInput.jsx      # 输入框
│   │   │   └── AudioToggle.jsx    # 语音开关
│   │   ├── hooks/
│   │   │   ├── useChat.js         # 聊天状态管理 + SSE
│   │   │   └── useAudio.js        # 音频播放
│   │   └── utils/
│   │       └── storage.js         # localStorage 工具
│   ├── index.html
│   ├── vite.config.js             # Vite 配置（含 API 代理）
│   └── package.json
└── package.json                   # 根配置（concurrently 启动）
```

## 生产构建

```bash
# 构建前端
npm run build

# 生产模式启动（Express 直接 serve 前端静态文件）
NODE_ENV=production node server/index.js
```

## 自定义

**修改人设 Prompt**：编辑 `server/prompts/fengge.js`，System Prompt 包含身份、表达模型、口头禅、场景应答模式等，可根据需要调整。

**更换音色**：修改 `server/.env` 中的 `FISH_AUDIO_VOICE_ID` 为你的模型 ID。

**更换大模型**：修改 `server/routes/chat.js` 中的 `model` 参数（默认 `deepseek-chat`），以及 `server/.env` 中的 `DEEPSEEK_BASE_URL`。
