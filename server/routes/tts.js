import { ProxyAgent } from 'undici';

export default async function ttsRoute(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text string required' });
    return;
  }

  const API_KEY = process.env.FISH_AUDIO_API_KEY;
  const VOICE_ID = process.env.FISH_AUDIO_VOICE_ID;

  if (!API_KEY || API_KEY === 'your-fish-audio-key') {
    console.error('[TTS] Fish Audio API key not configured');
    res.status(500).json({ error: 'Fish Audio API key not configured' });
    return;
  }

  if (!VOICE_ID || VOICE_ID === 'your-voice-id') {
    console.error('[TTS] Fish Audio voice ID not configured');
    res.status(500).json({ error: 'Fish Audio voice ID not configured' });
    return;
  }

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ text, voice_id: VOICE_ID }),
  };

  if (proxyUrl) {
    console.log('[TTS] Using proxy:', proxyUrl);
    fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
  }

  console.log('[TTS] Requesting, text length:', text.length, 'voice:', VOICE_ID);

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', fetchOptions);

    if (!response.ok) {
      const err = await response.text();
      console.error('[TTS] Fish Audio error:', response.status, err);
      res.status(response.status).json({ error: `Fish Audio error: ${err}` });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('[TTS] Success, audio size:', arrayBuffer.byteLength);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('[TTS] Exception:', err.message, err.cause || '');
    res.status(500).json({ error: err.message });
  }
}
