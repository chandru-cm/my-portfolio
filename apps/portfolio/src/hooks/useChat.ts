import { useCallback, useEffect, useRef, useState } from "react";
import { profile } from "@my-portfolio/content";
import { CHAT_ENDPOINT } from "../lib/site";
import { SseParser } from "../lib/sse";

export const MAX_QUESTIONS = 5;
export const MAX_QUESTION_CHARS = 300;
const HISTORY_TURNS = 6;

export type MessageKind = "answer" | "unknown" | "refusal" | "error";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  kind?: MessageKind;
  sources?: string[];
  /** False while the answer is still being produced. */
  done: boolean;
};

export type ChatStatus = "idle" | "thinking" | "streaming";

const UNAVAILABLE = `The assistant is unavailable right now. Please try again in a moment, or email ${profile.email}.`;

async function describeFailure(res: Response): Promise<string> {
  if (res.status === 429) {
    const wait = Number(res.headers.get("retry-after"));
    const when = Number.isFinite(wait) && wait > 0 ? ` Please try again in about ${wait} seconds, or` : " Please try again later, or";
    return `You've asked a lot of questions in a short time.${when} email ${profile.email}.`;
  }
  return UNAVAILABLE;
}

/** Chat state and streaming. Conversation lives in memory only: nothing is saved by the page. */
export function useChat(endpoint = CHAT_ENDPOINT) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [asked, setAsked] = useState(0);

  const messagesRef = useRef<ChatMessage[]>([]);
  const statusRef = useRef<ChatStatus>("idle");
  const askedRef = useRef(0);
  const nextId = useRef(1);
  const controllerRef = useRef<AbortController | null>(null);
  messagesRef.current = messages;

  const setBusy = useCallback((s: ChatStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const patch = useCallback((id: number, change: (m: ChatMessage) => ChatMessage) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? change(m) : m)));
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  /** Returns a message for the input to show when the question is rejected, otherwise null. */
  const send = useCallback(
    async (raw: string): Promise<string | null> => {
      const question = raw.replace(/\s+/g, " ").trim();
      if (!question) return "Type a question first";
      if (question.length > MAX_QUESTION_CHARS) return `Keep your question under ${MAX_QUESTION_CHARS} characters`;
      if (statusRef.current !== "idle") return null;
      if (askedRef.current >= MAX_QUESTIONS) return `You've reached the question limit for this session. Email ${profile.email}.`;

      const history = messagesRef.current
        .filter((m) => m.done && m.text && m.kind !== "error")
        .slice(-HISTORY_TURNS)
        .map((m) => ({ role: m.role, text: m.text }));

      const userId = nextId.current++;
      const replyId = nextId.current++;
      askedRef.current += 1;
      setAsked(askedRef.current);
      setMessages((ms) => [
        ...ms,
        { id: userId, role: "user", text: question, done: true },
        { id: replyId, role: "assistant", text: "", done: false },
      ]);
      setBusy("thinking");

      const fail = (text: string) => {
        patch(replyId, (m) => ({ ...m, text, kind: "error", done: true }));
        setBusy("idle");
      };

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question, history }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          fail(await describeFailure(res));
          return null;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const parser = new SseParser();
        let finished = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const { event, data } of parser.push(decoder.decode(value, { stream: true }))) {
            const d = data as { kind?: MessageKind; sources?: string[]; text?: string; message?: string };
            if (event === "meta") {
              patch(replyId, (m) => ({ ...m, kind: d.kind ?? "answer", sources: d.sources ?? [] }));
            } else if (event === "token") {
              setBusy("streaming");
              patch(replyId, (m) => ({ ...m, text: m.text + (d.text ?? "") }));
            } else if (event === "error") {
              patch(replyId, (m) => ({
                ...m,
                kind: "error",
                text: m.text ? `${m.text}\n\n${d.message ?? "The answer was interrupted."}` : (d.message ?? UNAVAILABLE),
                done: true,
              }));
              finished = true;
            } else if (event === "done") {
              patch(replyId, (m) => ({ ...m, done: true }));
              finished = true;
            }
          }
        }
        if (!finished) patch(replyId, (m) => (m.text ? { ...m, done: true } : { ...m, kind: "error", text: UNAVAILABLE, done: true }));
        setBusy("idle");
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return null;
        // Development only: say which URL failed, since a wrong or stopped server is the usual cause.
        if (import.meta.env.DEV) console.error(`Chat request to ${endpoint} failed`, error);
        const hint = import.meta.env.DEV ? ` (tried ${endpoint}. Is the chat API running? npm run dev starts it.)` : "";
        fail(`Couldn't reach the assistant. Check your connection and try again.${hint}`);
      }
      return null;
    },
    [endpoint, patch, setBusy]
  );

  return { messages, status, asked, remaining: Math.max(0, MAX_QUESTIONS - asked), send };
}
