import { useState, useCallback, useRef, useEffect } from 'react';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useChat(audioEnabled, playAudio) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);
  const messagesRef = useRef(messages);

  audioEnabledRef.current = audioEnabled;
  messagesRef.current = messages;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsgId = generateId();
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, userMsg, assistantMsg];
    setMessages(newMessages);
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
                const idx = updated.findIndex((m) => m.id === assistantMsgId);
                if (idx === -1) return prev;
                updated[idx] = { ...updated[idx], content: fullContent };
                return updated;
              });
            } else if (data.type === 'error') {
              fullContent = '兄弟，刚才信号不太好，你再说一遍？';
              setMessages((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((m) => m.id === assistantMsgId);
                if (idx === -1) return prev;
                updated[idx] = { ...updated[idx], content: fullContent };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }

      const finalMessages = newMessages.map((m) =>
        m.id === assistantMsgId ? { ...m, content: fullContent, timestamp: Date.now() } : m
      );
      setMessages(finalMessages);
      setIsStreaming(false);

      // TTS runs in background, doesn't block the UI
      if (fullContent.trim()) {
        fetchTTS(fullContent, assistantMsgId);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setIsStreaming(false);
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.id === assistantMsgId);
        if (idx === -1) return prev;
        updated[idx] = { ...updated[idx], content: '兄弟，网不太好，你等会儿再试试。' };
        return updated;
      });
      setIsStreaming(false);
    }
  }, [playAudio]);

  const fetchTTS = async (text, targetMsgId) => {
    try {
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        console.error('TTS request failed:', ttsRes.status, errText);
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === targetMsgId);
          if (idx === -1) return prev;
          updated[idx] = { ...updated[idx], audioUrl: null };
          return updated;
        });
        return;
      }

      const blob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(blob);

      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.id === targetMsgId);
        if (idx === -1) return prev;
        updated[idx] = { ...updated[idx], audioUrl };
        return updated;
      });

      if (audioEnabledRef.current) {
        playAudio(audioUrl);
      }
    } catch (err) {
      console.error('TTS fetch error:', err);
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.id === targetMsgId);
        if (idx === -1) return prev;
        updated[idx] = { ...updated[idx], audioUrl: null };
        return updated;
      });
    }
  };

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, clear };
}
