export default function AudioToggle({ enabled, onToggle }) {
  return (
    <div className="audio-toggle">
      <span>语音</span>
      <label className="switch">
        <input type="checkbox" checked={enabled} onChange={onToggle} />
        <span className="slider"></span>
      </label>
    </div>
  );
}
