
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ELEVENLABS_API_KEY;

// Allow the bundled Android Capacitor app and the hosted web app to call this API.
const allowedOrigins = new Set([
    "capacitor://localhost",
    "https://localhost",
    "http://localhost",
    "https://yosha-voice-ai.onrender.com"
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
    res.json({
        name: "YOSHA VOICE AI",
        status: "online",
        engine: "ElevenLabs",
        configured: Boolean(API_KEY)
    });
});

app.get("/api/voices", async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(503).json({
                error: "API key is not configured on the server."
            });
        }

        const response = await fetch(
            "https://api.elevenlabs.io/v1/voices",
            {
                headers: {
                    "xi-api-key": API_KEY
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.detail?.message ||
                       data.detail ||
                       "Unable to load voices."
            });
        }

        const voices = (data.voices || []).map(voice => ({
            voice_id: voice.voice_id,
            name: voice.name,
            category: voice.category || "general",
            labels: voice.labels || {},
            preview_url: voice.preview_url || null
        }));

        res.json({ voices });

    } catch (error) {
        console.error("Voice loading error:", error);

        res.status(500).json({
            error: "Voice service connection failed."
        });
    }
});

app.post("/api/generate", async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(503).json({
                error: "API key is not configured."
            });
        }

        const {
            text,
            voice_id,
            model_id,
            speed,
            stability,
            similarity_boost
        } = req.body || {};

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                error: "Please enter your text."
            });
        }

        if (text.length > 5000) {
            return res.status(400).json({
                error: "Maximum text length is 5000 characters."
            });
        }

        if (
            typeof voice_id !== "string" ||
            !/^[a-zA-Z0-9_-]{5,100}$/.test(voice_id)
        ) {
            return res.status(400).json({
                error: "Please select a valid voice."
            });
        }

        const allowedModels = [
            "eleven_multilingual_v2",
            "eleven_flash_v2_5"
        ];

        const selectedModel = allowedModels.includes(model_id)
            ? model_id
            : "eleven_multilingual_v2";

        const safeSpeed = Math.min(
            1.2,
            Math.max(0.7, Number(speed) || 1)
        );

        const safeStability = Math.min(
            1,
            Math.max(0, Number(stability) || 0.5)
        );

        const safeSimilarity = Math.min(
            1,
            Math.max(0, Number(similarity_boost) || 0.75)
        );

        const response = await fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/" +
            encodeURIComponent(voice_id) +
            "?output_format=mp3_44100_128",
            {
                method: "POST",
                headers: {
                    "xi-api-key": API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                },
                body: JSON.stringify({
                    text: text.trim(),
                    model_id: selectedModel,
                    voice_settings: {
                        stability: safeStability,
                        similarity_boost: safeSimilarity,
                        style: 0.2,
                        use_speaker_boost: true,
                        speed: safeSpeed
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "ElevenLabs error:",
                response.status,
                errorText
            );

            return res.status(response.status).json({
                error: "Audio generation failed. Check your ElevenLabs account and API limits."
            });
        }

        const audio = Buffer.from(
            await response.arrayBuffer()
        );

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="yosha-voice.mp3"'
        );
        res.setHeader("Content-Length", audio.length);
        res.setHeader("Cache-Control", "no-store");

        res.send(audio);

    } catch (error) {
        console.error("Generation error:", error);

        res.status(500).json({
            error: "Unexpected audio generation error."
        });
    }
});

app.get(/.*/, (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("================================");
    console.log("YOSHA VOICE AI SERVER");
    console.log("Port: " + PORT);
    console.log("ElevenLabs: " + Boolean(API_KEY));
    console.log("================================");
});
