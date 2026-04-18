export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type HFChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string } | string;
};

export async function hfChatCompletion(params: {
  baseUrl: string;
  token: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}): Promise<{ content: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const res = await fetch(`${params.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: HFChatCompletionResponse | undefined;
    try {
      json = text ? (JSON.parse(text) as HFChatCompletionResponse) : undefined;
    } catch {
      // ignorisi parse error; bacit ćemo bolji error ispod
    }

    if (!res.ok) {
      const message =
        (typeof json?.error === "string"
          ? json?.error
          : json?.error?.message) || `Hugging Face error (${res.status})`;
      throw new Error(message);
    }

    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Prazan odgovor modela");
    return { content };
  } finally {
    clearTimeout(timeout);
  }
}
