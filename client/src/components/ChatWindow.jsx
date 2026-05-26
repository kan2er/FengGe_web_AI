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
          <div className="empty-emoji">⛰️</div>
          <p>有啥困惑尽管问，峰哥给你捋一捋</p>
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
