/**
 * Bankr LLM Gateway client (server-side only). The gateway is OpenAI-compatible:
 * POST {BANKR_LLM_URL}/chat/completions with the Bankr API key (bk_...) in the
 * X-API-Key header. The key needs "LLM Gateway" enabled at bankr.bot/api-keys
 * and the account needs LLM credits.
 */
const BASE = (process.env.BANKR_LLM_URL || "https://llm.bankr.bot/v1").replace(/\/+$/, "");
export const BANKR_MODEL = process.env.BANKR_LLM_MODEL || "claude-opus-4.8";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class BankrError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BankrError";
  }
}

export function bankrKey(): string | null {
  return (process.env.BANKR_LLM_KEY || process.env.BANKR_API_KEY)?.trim() || null;
}

export async function bankrChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const key = bankrKey();
  if (!key) throw new BankrError("The AI Twin isn't configured yet (missing BANKR_LLM_KEY).", 503);

  let res: Response;
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        model: BANKR_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 300,
        temperature: opts.temperature ?? 0.8,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new BankrError("Couldn't reach the AI right now. Try again in a moment.", 502);
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    if (res.status === 401 || res.status === 403) throw new BankrError("The AI Twin's API key was rejected.", 502);
    if (res.status === 402) throw new BankrError("The AI Twin is out of credits for now.", 503);
    if (res.status === 429) throw new BankrError("The AI Twin is busy. Try again in a moment.", 429);
    throw new BankrError(`The AI didn't answer (${res.status})${detail ? `: ${detail}` : ""}.`, 502);
  }

  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new BankrError("The AI returned an empty answer.", 502);
  return text;
}
