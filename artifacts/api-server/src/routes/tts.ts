import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const MAX_TTS_CHARACTERS = 1200;

router.post("/tts", async (req, res) => {
  const provider = process.env.TTS_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.TTS_API_KEY;
  const voiceId = process.env.TTS_VOICE_ID;
  const model = process.env.TTS_MODEL || "eleven_multilingual_v2";
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (provider !== "elevenlabs" || !apiKey || !voiceId) {
    return res.status(503).json({ error: "tts_unavailable" });
  }

  if (!text || text.length > MAX_TTS_CHARACTERS) {
    return res.status(400).json({ error: "invalid_tts_text" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      logger.warn({ provider, status: response.status }, "TTS provider request failed");
      return res.status(502).json({ error: "tts_provider_error" });
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.send(audio);
  } catch (error) {
    logger.warn({ err: error, provider }, "TTS provider request errored");
    return res.status(502).json({ error: "tts_provider_error" });
  }
});

export default router;