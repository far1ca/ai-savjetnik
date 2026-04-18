import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { loadEnv } from "./env.js";
import { hfChatCompletion } from "./hfChat.js";
import { MEDICAL_SYSTEM_PROMPT } from "./medicalPrompt.js";

const env = loadEnv();

const app = express();
app.use(express.json({ limit: "32kb" }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
});

app.post("/api/chat", async (req, res) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const result = await hfChatCompletion({
      baseUrl: env.HF_BASE_URL,
      token: env.HF_TOKEN,
      model: env.HF_MODEL,
      messages: [
        { role: "system", content: MEDICAL_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "User symptom description:\n" +
            parsed.data.message +
            "\n\nRemember: provide differential + red flags + next steps; no definitive diagnosis.",
        },
      ],
      temperature: 0.2,
      maxTokens: 8192,
      timeoutMs: 60_000,
    });

    res.json({ reply: result.content });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
