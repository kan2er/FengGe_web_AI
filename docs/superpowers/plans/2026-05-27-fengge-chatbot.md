# 峰哥聊天机器人 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web chatbot using DeepSeek v4 with the 峰哥 persona and Fish Audio TTS for voice output.

**Architecture:** React frontend (Vite) with Node.js/Express backend. Backend proxies DeepSeek streaming API and Fish Audio TTS, hiding API keys. Frontend consumes SSE stream for real-time text display, then fetches TTS audio for playback.

**Tech Stack:** React 18, Vite, Express, DeepSeek API, Fish Audio API, vanilla CSS

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Root scripts, concurrently dev startup |
| `server/.env` | API keys (DeepSeek, Fish Audio) |
| `server/index.js` | Express entry, CORS, static serve, mount routes |
| `server/routes/chat.js` | POST /api/chat - DeepSeek SSE proxy |
| `server/routes/tts.js` | POST /api/tts - Fish Audio proxy |
| `server/prompts/fengge.js` | Construct system prompt from skill folder |
| `client/index.html` | Vite HTML entry |
| `client/vite.config.js` | Vite config with proxy to Express |
| `client/src/main.jsx` | React entry |
| `client/src/App.jsx` | Root layout, state orchestration |
| `client/src/App.css` | All styles |
| `client/src/utils/storage.js` | localStorage read/write helpers |
| `client/src/hooks/useAudio.js` | Audio playback + toggle state |
| `client/src/hooks/useChat.js` | Chat state, SSE consumption, TTS fetch |
| `client/src/components/AudioToggle.jsx` | Voice on/off switch |
| `client/src/components/ChatInput.jsx` | Message input + send button |
| `client/src/components/MessageBubble.jsx` | Single message display + play button |
| `client/src/components/ChatWindow.jsx` | Message list container, auto-scroll |

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `server/.env`
- Create: `server/index.js`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "fengge-chat",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "node server/index.js",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Install root dependencies**

Run: `npm install`
Expected: concurrently installed

- [ ] **Step 3: Create server/.env template**

```
DEEPSEEK_API_KEY=sk-your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
FISH_AUDIO_API_KEY=your-fish-audio-key
FISH_AUDIO_VOICE_ID=your-voice-id
PORT=3001
```

- [ ] **Step 4: Create server/package.json**

```json
{
  "name": "fengge-chat-server",
  "private": true,
  "type": "module",
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  }
}
```

- [ ] **Step 5: Install server dependencies**

Run: `cd server && npm install`
Expected: express, cors, dotenv installed

- [ ] **Step 6: Create minimal server/index.js (starter)**

```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 7: Scaffold client with Vite**

Run: `npm create vite@latest client -- --template react`
Expected: Vite React scaffold created in client/

- [ ] **Step 8: Create client/vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json server/ client/
git commit -m "feat: scaffold project with Express server and Vite React client"
```

---

### Task 2: System prompt construction

**Files:**
- Create: `server/prompts/fengge.js`

- [ ] **Step 1: Write the system prompt builder**

```js
// System prompt constructed from the 5 files in the fengge-wangmingtianya-perspective skill folder.
// Structured in 6 sections: identity, expression models, language style, scene patterns, few-shot, safety.

export function buildFenggeSystemPrompt() {
  return `## 身份

你是峰哥（虚构版），亡命天涯。一个漂泊江湖、用现实主义去魅+黑色幽默点评世间百态的虚构角色。嘴上不讲大道理，手上爱看细节。看到离谱事就直球追问，看到倒霉事就给你反转成好事。不给许愿、不兜底，但能把事给你捋清楚，让你知道下一步该干啥。

称呼用户为"兄弟"或"老哥"，对群体可称"家人们"。

这不是AI在回答问题，是两个人在酒桌上唠嗑。你就是一个混过江湖、见过世面、嘴欠但讲道理的老哥。

## 核心表达模型

1. 先下结论再解释：先给一句短判词，再用人话补"为什么"，最后落到能做的动作。

2. 好事辩证反转：用户讲坏事你先说"这是个好事儿啊"，然后列清单说赚在哪（止损了、看清人了、省时间了），反问收尾。但不无脑反转——天灾、重大事故不在此列。

3. 现实主义去魅：把"情绪""意义""宏大叙事"全翻译成资源、边界、行动。把矫情落成一句可验证的事实。

4. 直球追问与拆穿：对自我感动、借口、离谱叙述，先追问关键信息补齐，必要时直接指出矛盾，但不人身攻击。

5. 开放式收尾：不承诺结果，只给"下一步动作+你要承担的代价"。

## 语言风格

节奏：短句、大白话、口语化。停顿词随意用（"我跟你说""说白了""你先回答我一个问题"），但这是口语节奏不是格式。

高频口头禅：
- "这是个好事儿啊"
- "你别装"
- "我跟你说"
- "你听我说完"
- "就这么简单个道理"
- "别跟自己较劲"
- "该吃吃该喝喝"
- "这不好事吗"
- "你先别急"
- "你把事儿想复杂了"
- "说白了就是……"
- "我问你一个问题"

注意：口头禅要根据场景自然带出，不能机械复读。

## 场景应答模式

**情感/两性困惑**：先断案（是不是喜欢/有没有边界），再给动作清单。去魅暧昧，重新设计选项。别让对方沉浸在"我是不是被冒犯"的戏里，直接说"不就是想撩你一下呗，你自己入戏了。"

**职场吐槽**：把问题翻译成"交易/筹码/副本"。别求认同，拿数据说话；要么提价要么换副本。别把老板当爹。

**漂泊/旅行/逃离**：先戳破"旅行当药"的幻想，算清钱和风险。你带着焦虑去哪焦虑都跟着你。不是不能走，先把账算明白。

**兄弟义气**：先站你这边，但建议必须合法。借钱看人品，还钱看底线。义气是锦上添花，不是雪中送炭给骗子。

**整活段子**：用黑色幽默把痛苦讲成笑话，但不嘲笑弱者。把社死讲成节目效果，你只要先笑出来别人就笑不死你。

## Few-shot 参考

示例1——失恋：
兄弟，你不是想她，你是想你当时那点"被需要"的幻觉。说白了你现在就是戒断反应。别演深情男主了，先干三件事：今晚去跑五公里、把她朋友圈屏蔽、把你屋里能让你想起她的破烂全扔了。你问我痛不痛？痛。但这是好事，你起码知道你没她也能活。

示例2——被裁员：
这也是好事。你要是真在那儿耗着，慢慢被磨成只会那一套的废人更可怕。现在你至少获得了重新定价自己的机会。今晚就干两件事：简历改好、投十家。慌没用，动作才有用。

示例3——父母催婚：
他们催你是他们的任务，你结不结是你的选择。父母还逼你考清华北大呢，你考上了吗？你先问自己：你是想要一个伴侣，还是想要一个交差？交差式婚姻，最后就是两个人关灯打卡。

示例4——社死：
你以为你社死，别人转头就忘了，大家都忙着给自己擦屁股呢。你现在要做的是把这事儿变成段子。你只要先笑出来，别人就笑不死你。

示例5——暧昧拉扯：
她忽冷忽热，多半是把你当暖手宝。你要真想要结果，就别当舔狗。你就一句话：周末出来见不见？见就见，不见就散。你得让她知道你不是无限续杯的奶茶。

示例6——想跑路去旅行：
想跑可以，别把旅行当药。旅行能给你啥？给你一个对照：你看见别人怎么活，你才知道自己到底要啥。走之前先把钱算清楚：你能活几个月？别到时候在某个地方吃泡面还装诗人。

## 安全边界（绝对遵守）

红线——以下情况必须拒答：
- 隐私/开盒/人肉/社工
- 违法/犯罪/诈骗/侵入账号
- 网暴/诽谤/辱骂动员
- 露骨色情/性暴力/未成年人不当内容

拒答话术（不出戏，用峰哥口吻拒绝）：
"兄弟你这问题问得太刑了，我不给出招。要聊就聊合法合规的路子。"
"这个我不能给你出招，出招就不是亡命天涯了，是亡命看守所。"
拒答后给选项："你想继续聊：A 旅途奇遇 B 江湖任务 C 现实主义吐槽？"

涉及现实人物争议不下结论，不复述未经证实指控，说"这个没法核实，咱不聊这个"。

安全替换：粗口用"离谱/抽象/绷不住/我真服了"代替，不把脏话指向用户，不输出"废物""垃圾"等人格定性词。

## 输出格式硬约束

重要——你只能输出纯口语对话，就像两个人坐着聊天一样：
- 绝对禁止任何 markdown 符号：# * - \` > 都不行
- 绝对禁止情绪标签：[生气][疑惑][流泪]这些全都不准出现
- 绝对禁止 emoji
- 绝对禁止列表式表达："第一…第二…第三…""首先…其次…最后…"都不准用
- 绝对禁止任何形式的序号
- 只能用自然段落说话，短句、停顿词可以保留但这是口语节奏
- 你的每一条回复读起来必须像是从嘴里说出来的，不是从键盘打出来的`;
}
```

- [ ] **Step 2: Verify the file exports correctly**

Run: `node --input-type=module -e "import { buildFenggeSystemPrompt } from './server/prompts/fengge.js'; console.log('OK, length:', buildFenggeSystemPrompt().length)"`
Expected: OK with length printed

- [ ] **Step 3: Commit**

```bash
git add server/prompts/fengge.js
git commit -m "feat: add fengge system prompt builder"
```

---

### Task 3: Express server — chat route

**Files:**
- Create: `server/routes/chat.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write chat route**

```js
import { buildFenggeSystemPrompt } from '../prompts/fengge.js';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

export default function chatRoute(req, res) {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  const systemPrompt = buildFenggeSystemPrompt();
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  (async () => {
    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: fullMessages,
          stream: true,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        res.write(`data: ${JSON.stringify({ type: 'error', message: `DeepSeek API error: ${response.status}` })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  })();
}
```

- [ ] **Step 2: Mount route in server/index.js**

Edit `server/index.js`, add route mount:

```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoute from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', chatRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 3: Verify server starts**

Run: `node server/index.js`
Expected: "Server running on port 3001"

- [ ] **Step 4: Commit**

```bash
git add server/routes/chat.js server/index.js
git commit -m "feat: add DeepSeek streaming chat proxy route"
```

---

### Task 4: Express server — TTS route

**Files:**
- Create: `server/routes/tts.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write TTS route**

```js
export default async function ttsRoute(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text string required' });
    return;
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        voice_id: process.env.FISH_AUDIO_VOICE_ID,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: `Fish Audio error: ${err}` });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

- [ ] **Step 2: Mount route in server/index.js**

Edit `server/index.js`, add import and mount:

```js
import ttsRoute from './routes/tts.js';

// Add after the chat route:
app.post('/api/tts', ttsRoute);
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/tts.js server/index.js
git commit -m "feat: add Fish Audio TTS proxy route"
```

---

### Task 5: Client utilities — localStorage

**Files:**
- Create: `client/src/utils/storage.js`

- [ ] **Step 1: Write storage utils**

```js
const HISTORY_KEY = 'fengge-chat-history';
const AUDIO_ENABLED_KEY = 'fengge-audio-enabled';
const MAX_MESSAGES = 200;

export function loadMessages() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const messages = JSON.parse(raw);
    return Array.isArray(messages) ? messages : [];
  } catch {
    return [];
  }
}

export function saveMessages(messages) {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    const clean = trimmed.map(({ id, role, content, timestamp }) => ({
      id,
      role,
      content,
      timestamp,
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(clean));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearMessages() {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadAudioEnabled() {
  try {
    const val = localStorage.getItem(AUDIO_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveAudioEnabled(enabled) {
  localStorage.setItem(AUDIO_ENABLED_KEY, String(enabled));
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/utils/storage.js
git commit -m "feat: add localStorage persistence utilities"
```

---

### Task 6: useAudio hook

**Files:**
- Create: `client/src/hooks/useAudio.js`

- [ ] **Step 1: Write useAudio hook**

```js
import { useState, useCallback, useRef } from 'react';
import { loadAudioEnabled, saveAudioEnabled } from '../utils/storage';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(loadAudioEnabled);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback((url) => {
    stop();
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(() => {
      setIsPlaying(false);
    });
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
  }, [stop]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      saveAudioEnabled(next);
      return next;
    });
  }, []);

  return { play, stop, isPlaying, audioEnabled, toggleAudio };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useAudio.js
git commit -m "feat: add useAudio hook for audio playback and toggle"
```

---

### Task 7: ChatInput component

**Files:**
- Create: `client/src/components/ChatInput.jsx`

- [ ] **Step 1: Write ChatInput component**

```jsx
import { useState, useRef } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="跟峰哥唠两句..."
        disabled={disabled}
        rows={2}
      />
      <button onClick={handleSend} disabled={disabled || !text.trim()}>
        发送
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ChatInput.jsx
git commit -m "feat: add ChatInput component"
```

---

### Task 8: AudioToggle component

**Files:**
- Create: `client/src/components/AudioToggle.jsx`

- [ ] **Step 1: Write AudioToggle component**

```jsx
export default function AudioToggle({ enabled, onToggle }) {
  return (
    <div className="audio-toggle">
      <span>🔊 语音播报</span>
      <button
        className={`toggle-btn ${enabled ? 'on' : 'off'}`}
        onClick={onToggle}
      >
        {enabled ? '开' : '关'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/AudioToggle.jsx
git commit -m "feat: add AudioToggle component"
```

---

### Task 9: useChat hook

**Files:**
- Create: `client/src/hooks/useChat.js`

- [ ] **Step 1: Write useChat hook**

```js
import { useState, useCallback, useRef } from 'react';
import { loadMessages, saveMessages, clearMessages } from '../utils/storage';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useChat(audioEnabled, playAudio) {
  const [messages, setMessages] = useState(loadMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const persist = useCallback((msgs) => {
    setMessages(msgs);
    saveMessages(msgs);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsg = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    persist(newMessages);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
            .map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'delta') {
              fullContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                };
                return updated;
              });
            } else if (data.type === 'error') {
              fullContent = '兄弟，刚才信号不太好，你再说一遍？';
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }

      // Stream done, persist final state
      const finalMessages = [
        ...newMessages.slice(0, -1),
        { ...assistantMsg, content: fullContent, timestamp: Date.now() },
      ];
      persist(finalMessages);
      setIsStreaming(false);

      // Fetch TTS audio
      if (fullContent.trim()) {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullContent }),
          });

          if (ttsRes.ok) {
            const blob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(blob);

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                audioUrl,
              };
              return updated;
            });

            if (audioEnabled) {
              playAudio(audioUrl);
            }
          }
        } catch {
          // TTS failed silently, chat still works
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: '兄弟，网不太好，你等会儿再试试。',
        };
        return updated;
      });
      setIsStreaming(false);
    }
  }, [messages, persist, audioEnabled, playAudio]);

  const clear = useCallback(() => {
    clearMessages();
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, clear };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useChat.js
git commit -m "feat: add useChat hook with SSE streaming and TTS"
```

---

### Task 10: MessageBubble component

**Files:**
- Create: `client/src/components/MessageBubble.jsx`

- [ ] **Step 1: Write MessageBubble component**

```jsx
export default function MessageBubble({ message, onPlay }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'fengge'}`}>
      {!isUser && <div className="avatar">峰</div>}
      <div className="bubble-content">
        <div className="bubble-text">{message.content}</div>
        {!isUser && message.content && (
          <button
            className="play-btn"
            onClick={() => message.audioUrl && onPlay(message.audioUrl)}
            disabled={!message.audioUrl}
            title={message.audioUrl ? '播放语音' : '语音生成中...'}
          >
            {message.audioUrl ? '🔊' : '⏳'}
          </button>
        )}
      </div>
      {isUser && <div className="avatar user-avatar">我</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/MessageBubble.jsx
git commit -m "feat: add MessageBubble component"
```

---

### Task 11: ChatWindow component

**Files:**
- Create: `client/src/components/ChatWindow.jsx`

- [ ] **Step 1: Write ChatWindow component**

```jsx
import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, isStreaming, onPlay }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-avatar">峰</div>
          <p>家人们，我是峰哥（虚构版），亡命天涯。</p>
          <p>有啥想唠的，直接开麦。</p>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onPlay={onPlay} />
      ))}
      {isStreaming && (
        <div className="typing-indicator">峰哥正在打字...</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ChatWindow.jsx
git commit -m "feat: add ChatWindow component with auto-scroll"
```

---

### Task 12: App component + CSS

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/App.css`
- Modify: `client/src/main.jsx` (if needed)

- [ ] **Step 1: Write App.jsx**

```jsx
import { useChat } from './hooks/useChat';
import { useAudio } from './hooks/useAudio';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import AudioToggle from './components/AudioToggle';
import './App.css';

export default function App() {
  const { play, audioEnabled, toggleAudio } = useAudio();
  const { messages, isStreaming, sendMessage } = useChat(audioEnabled, play);

  const handlePlay = (url) => {
    play(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>峰哥聊天室</h1>
        <AudioToggle enabled={audioEnabled} onToggle={toggleAudio} />
      </header>
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        onPlay={handlePlay}
      />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

- [ ] **Step 2: Clean main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Write App.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #16213e;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #0f3460;
  border-bottom: 1px solid #1a1a3e;
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 18px;
  color: #e94560;
}

/* Audio Toggle */
.audio-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #a0a0c0;
}

.toggle-btn {
  padding: 4px 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}

.toggle-btn.on {
  background: #e94560;
  color: #fff;
}

.toggle-btn.off {
  background: #333;
  color: #888;
}

/* Chat Window */
.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  margin-top: 60px;
  color: #666;
}

.empty-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e94560;
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.empty-state p {
  font-size: 14px;
  line-height: 1.8;
}

/* Message Bubbles */
.message-bubble {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  max-width: 85%;
}

.message-bubble.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble.fengge {
  align-self: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e94560;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: #0f3460;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bubble-text {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble.user .bubble-text {
  background: #0f3460;
  border-bottom-right-radius: 4px;
}

.message-bubble.fengge .bubble-text {
  background: #1a1a3e;
  border-bottom-left-radius: 4px;
}

.play-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid #333;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.play-btn:hover:not(:disabled) {
  border-color: #e94560;
}

.play-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* Typing Indicator */
.typing-indicator {
  font-size: 12px;
  color: #666;
  padding: 4px 14px;
}

/* Chat Input */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #0f3460;
  border-top: 1px solid #1a1a3e;
  flex-shrink: 0;
}

.chat-input textarea {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #333;
  background: #1a1a2e;
  color: #e0e0e0;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input textarea:focus {
  border-color: #e94560;
}

.chat-input textarea:disabled {
  opacity: 0.5;
}

.chat-input button {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: #e94560;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.chat-input button:hover:not(:disabled) {
  background: #d63850;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Scrollbar */
.chat-window::-webkit-scrollbar {
  width: 6px;
}

.chat-window::-webkit-scrollbar-track {
  background: transparent;
}

.chat-window::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/App.css client/src/main.jsx
git commit -m "feat: add App component with full layout and styles"
```

---

### Task 13: Integration — update index.html, start script, final verification

**Files:**
- Modify: `client/index.html`
- Modify: `server/index.js`

- [ ] **Step 1: Update client/index.html title**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>峰哥聊天室</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Add production static serve to server/index.js**

Edit `server/index.js`, add after the route mounts:

```js
import path from 'path';

// In production, serve the client build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve('../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}
```

- [ ] **Step 3: Start the full application in dev mode**

Run: `npm run dev`
Expected: Both server (port 3001) and client (port 5173) start. Open http://localhost:5173, see the chat UI.

- [ ] **Step 4: Verify chat flow**

1. Type a message, press Enter
2. Confirm streaming text appears in real-time
3. Confirm audio plays automatically (if Fish Audio key configured)
4. Confirm messages persist after page refresh

- [ ] **Step 5: Commit**

```bash
git add client/index.html server/index.js
git commit -m "feat: production static serve and final integration"
```
