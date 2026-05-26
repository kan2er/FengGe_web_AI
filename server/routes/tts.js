export default async function ttsRoute(req, res) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text string required' });
    return;
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        voice_id: process.env.FISH_AUDIO_VOICE_ID,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: `Fish Audio error: ${err}` });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
