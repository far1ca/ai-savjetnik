import React, { useMemo, useRef, useState } from "react";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Renders `**like this**` segments as bold; newlines preserved. */
function renderMessageContent(content: string): React.ReactNode {
  return content.split("\n").map((line, lineIdx) => (
    <React.Fragment key={lineIdx}>
      {line
        .split("**")
        .map((segment, segIdx) =>
          segIdx % 2 === 0 ? (
            <React.Fragment key={segIdx}>{segment}</React.Fragment>
          ) : (
            <strong key={segIdx}>{segment}</strong>
          ),
        )}
      <br />
    </React.Fragment>
  ));
}

function getApiBase(): string {
  return "https://ai-savjetnik.onrender.com";
}

export function App() {
  const apiBase = useMemo(() => getApiBase(), []);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uuid(),
      role: "assistant",
      content:
        "Opisite svoje simptome (i trajanje, dobna kategorija, relevantna povijest). Predložit ću moguće uzroke, dodatna pitanja, znakove rizika i moguće daljnje korake.\n\nOvo je obrazovno i nije zamjena za stručni savjet, tretman, ili dijagnozu doktora.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || isSending) return;

    setError(null);
    setIsSending(true);
    setInput("");

    const userMsg: ChatMsg = { id: uuid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Request failed");

      const assistantMsg: ChatMsg = {
        id: uuid(),
        role: "assistant",
        content: (json.reply || "").trim(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      queueMicrotask(() =>
        scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: "assistant",
          content:
            "Nisam mogao dosegnuti backend. Provjerite da li je backend pokrenut.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <div className="dot" aria-hidden="true" />
          <div>
            <div className="title">AI Zdravstveni Savjetnik</div>
            <div className="subtitle">Minimalni interfejs za dijagnostiku</div>
          </div>
        </div>
        <div className="pill" title="Not a medical diagnosis">
          Obrazovne svrhe
        </div>
      </header>

      <main className="card">
        <div className="disclaimer">
          Ako se osjećate veoma loše (jaka bol u prsima, otežano disanje,
          znakovi moždanog udara, jako krvarenje, suicidalne misli), potražite
          hitnu pomoć ili odmah nazovite lokalnu hitnu pomoć.
        </div>

        <div className="chat">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="bubble">{renderMessageContent(m.content)}</div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Unesite simptome ovdje… (primjer: “28M, 3 dana bol u grlu, temperatura 38.5C, bez kašlja…”)"
            rows={4}
            disabled={isSending}
          />
          <div className="row">
            <div className="hint">
              {error ? (
                <span className="error">{error}</span>
              ) : (
                <span>Backend: {apiBase}</span>
              )}
            </div>
            <button
              type="button"
              className="send-btn"
              onClick={send}
              disabled={isSending || !input.trim()}
              aria-busy={isSending}
            >
              {isSending ? (
                <>
                  <span className="send-spinner" aria-hidden="true" />
                  <span>Slanje..</span>
                </>
              ) : (
                "Pošalji"
              )}
            </button>
          </div>
        </div>
      </main>

      <footer className="foot">
        Ovaj alat nije zamjena za stručni savjet, tretman, ili dijagnozu
        doktora.
      </footer>
    </div>
  );
}
