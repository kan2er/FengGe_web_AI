import { useState, useCallback, useRef, useEffect } from 'react';
import { loadAudioEnabled, saveAudioEnabled } from '../utils/storage';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(loadAudioEnabled);
  const audioRef = useRef(null);

  useEffect(() => {
    saveAudioEnabled(audioEnabled);
  }, [audioEnabled]);

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
    setAudioEnabled((prev) => !prev);
  }, []);

  return { play, stop, isPlaying, audioEnabled, toggleAudio };
}
