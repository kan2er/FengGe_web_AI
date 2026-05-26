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
