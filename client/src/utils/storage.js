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
