import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HF_TOKEN: z.string().min(1, "HF_TOKEN is required"),
  HF_MODEL: z.string().min(1).default("deepseek-ai/DeepSeek-R1"),
  HF_BASE_URL: z
    .string()
    .url()
    .default("https://api-inference.huggingface.co/v1"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
