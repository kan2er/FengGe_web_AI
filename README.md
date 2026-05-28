# 峰哥亡命天涯 · AI 聊天机器人

基于 DeepSeek 大模型 + 峰哥亡命天涯人设 + Fish Audio 语音克隆的 AI 聊天机器人。文字由 DeepSeek 生成具有峰哥"江湖漂泊+现实主义去魅+黑色幽默"风格的回复，语音由 Fish Audio 训练的峰哥音色模型朗读。

## 桌面端使用（推荐）

无需安装任何开发环境，下载解压即可使用。

### 1. 下载

从 [Releases](https://github.com/kan2er/FengGe_web_AI/releases) 下载 `FengGeChatAI.zip`，解压到任意目录。

### 2. 配置

解压目录中有一个 `config.json.example` 文件，编辑它填入你的 API Key：

```json
{
  "DEEPSEEK_BASE_URL": "https://api.deepseek.com",
  "DEEPSEEK_API_KEY": "sk-你的DeepSeek密钥",
  "FISH_AUDIO_API_KEY": "",
  "FISH_AUDIO_VOICE_ID": "",
  "HTTPS_PROXY": "",
  "PORT": 3001
}
```

| 配置项 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | **必填**。在 [DeepSeek 开放平台](https://platform.deepseek.com) 注册获取 |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址，默认官网即可 |
| `FISH_AUDIO_API_KEY` | 可选。在 [Fish Audio](https://fish.audio) 控制台生成 |
| `FISH_AUDIO_VOICE_ID` | 可选。Fish Audio 训练的峰哥音色模型 ID |
| `HTTPS_PROXY` | 可选。国内访问 Fish Audio 需代理，如 `http://127.0.0.1:7890` |
| `PORT` | 本地服务端口，默认 3001 |

填好后将文件重命名为 `config.json`。

### 3. 启动

双击 `FengGeChatAI.exe`。如果配置有问题，程序会弹窗提示。

---

## 开发者使用

适合需要修改代码、自定义 Prompt 的开发者。

### 前置要求

- **Node.js** >= 18
- **npm** >= 9
- DeepSeek API Key
- Fish Audio API Key + 音色 ID（可选，不填则纯文字聊天）

### 安装

```bash
git clone https://github.com/kan2er/FengGe_web_AI.git
cd FengGe_web_AI
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 配置

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`，格式与桌面端的 `config.json` 相同（KEY=VALUE 格式）：

```env
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_API_KEY=sk-你的key
FISH_AUDIO_API_KEY=
FISH_AUDIO_VOICE_ID=
PORT=3001
HTTPS_PROXY=
```

### 启动

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

### 生产构建

```bash
npm run build       # 构建前端
NODE_ENV=production node server/index.js
```

### 打包桌面应用

```bash
npm run electron:zip    # 产出 release/FengGeChatAI.zip
```

---

## 使用说明

1. 在输入框输入内容，按 Enter 发送
2. 等待峰哥回复（文本流式输出，语音在文本生成完毕后播放）
3. 峰哥回复右侧有播放按钮，可点击重播语音
4. 顶部开关可控制是否自动播放语音
5. 聊天记录仅在当前会话保留，刷新后清空

---

## 项目结构

```
fengge-chat/
├── electron/
│   └── main.cjs                     # Electron 主进程（读配置 → 起服务 → 开窗口）
├── server/
│   ├── index.js                     # 开发模式入口（dotenv + listen）
│   ├── app.js                       # Express app 模块（供 index.js 和 Electron 共用）
│   ├── routes/
│   │   ├── chat.js                  # DeepSeek API 流式代理（SSE）
│   │   └── tts.js                   # Fish Audio TTS 代理
│   ├── prompts/
│   │   └── fengge.js                # 峰哥系统 Prompt
│   ├── package.json
│   └── .env                         # API Key（不提交到 Git）
├── client/
│   ├── src/
│   │   ├── App.jsx                  # 主组件
│   │   ├── App.css                  # 全局样式
│   │   ├── main.jsx                 # React 入口
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx       # 消息列表
│   │   │   ├── MessageBubble.jsx    # 单条消息气泡
│   │   │   ├── ChatInput.jsx        # 输入框
│   │   │   └── AudioToggle.jsx      # 语音开关
│   │   ├── hooks/
│   │   │   ├── useChat.js           # 聊天状态管理 + SSE
│   │   │   └── useAudio.js          # 音频播放
│   │   └── utils/
│   │       └── storage.js           # localStorage 工具
│   ├── index.html
│   ├── vite.config.js               # Vite 配置（含 API 代理）
│   └── package.json
├── config.json.example              # 桌面端配置文件模板
└── package.json                     # 根配置（concurrently + electron-builder）
```

---

## 自定义

**修改人设 Prompt**：编辑 `server/prompts/fengge.js`。

**更换音色**：修改配置中的 `FISH_AUDIO_VOICE_ID`。

**更换大模型**：修改 `server/routes/chat.js` 中的 `model` 参数（默认 `deepseek-chat`），以及配置中的 `DEEPSEEK_BASE_URL`。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite |
| 后端 | Node.js + Express |
| 桌面端 | Electron |
| AI 文本 | DeepSeek API（流式输出） |
| AI 语音 | Fish Audio TTS（自定义音色） |
