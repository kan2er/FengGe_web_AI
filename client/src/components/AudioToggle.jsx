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
