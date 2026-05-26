export default function MessageBubble({ message, onPlay }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'fengge'}`}>
      {!isUser && <div className="avatar fengge-avatar">🎙️</div>}
      {isUser && <div className="avatar user-avatar">👤</div>}
      <div className="bubble-content">
        <div className="bubble-text">{message.content}</div>
        {!isUser && message.content && message.audioUrl !== null && (
          <button
            className="play-btn"
            onClick={() => message.audioUrl && onPlay(message.audioUrl)}
            disabled={!message.audioUrl}
            title={message.audioUrl ? '播放语音' : '语音生成中...'}
          >
            {message.audioUrl ? '▶' : '◌'}
          </button>
        )}
      </div>
    </div>
  );
}
