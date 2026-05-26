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
        <h1>峰哥亡命天涯·AI</h1>
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
