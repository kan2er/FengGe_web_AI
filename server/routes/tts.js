import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default function ttsRoute(req, res) {
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

  const proxyUrl = process.env.HTTPS_PROXY || '';
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

  if (proxyUrl) {
    console.log('[TTS] Using proxy:', proxyUrl);
  }
  console.log('[TTS] Requesting, text length:', text.length, 'voice:', VOICE_ID);

  const body = JSON.stringify({ text, voice_id: VOICE_ID });

  const options = {
    hostname: 'api.fish.audio',
    port: 443,
    path: '/v1/tts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
    agent,
    timeout: 30000,
  };

  const fishReq = https.request(options, (fishRes) => {
    const chunks = [];

    fishRes.on('data', (chunk) => chunks.push(chunk));
    fishRes.on('end', () => {
      const data = Buffer.concat(chunks);

      if (fishRes.statusCode !== 200) {
        console.error('[TTS] Fish Audio error:', fishRes.statusCode, data.toString());
        res.status(fishRes.statusCode).json({ error: `Fish Audio error: ${data.toString()}` });
        return;
      }

      console.log('[TTS] Success, audio size:', data.length);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(data);
    });
  });

  fishReq.on('error', (err) => {
    console.error('[TTS] Exception:', err.message);
    res.status(500).json({ error: err.message });
  });

  fishReq.on('timeout', () => {
    fishReq.destroy();
    console.error('[TTS] Request timeout');
    res.status(500).json({ error: 'Fish Audio request timeout' });
  });

  fishReq.write(body);
  fishReq.end();
}
