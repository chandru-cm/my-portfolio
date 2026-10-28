import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile, suggestionPool } from "@my-portfolio/content";
import { MAX_QUESTION_CHARS, useChat, type ChatMessage } from "../hooks/useChat";
import { linkify } from "../lib/linkify";
import { pickSuggestions } from "../lib/suggestions";

/** How long the starter questions stay put before a new set rotates in, while the visitor has not touched anything. */
const ROTATE_MS = 12_000;

/** A model answer that says it has nothing on the topic should not list sources as if it did. */
const DECLINES = /^I don't have that information/i;

const SPARK = "M12 2c.4 4.6 2.4 6.9 7 7.4v.2c-4.6.5-6.6 2.8-7 7.4h-.2c-.4-4.6-2.4-6.9-7-7.4v-.2c4.6-.5 6.6-2.8 7-7.4z";

function Spark({ size = 16 }: { size?: number }) {
  return (
    <svg className="spark" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={SPARK} />
      <path d="M19 15c.2 2 1 2.9 3 3.1v.1c-2 .2-2.8 1.1-3 3.1h-.1c-.2-2-1-2.9-3-3.1v-.1c2-.2 2.8-1.1 3-3.1z" opacity=".7" />
    </svg>
  );
}

function Linked({ text }: { text: string }): ReactNode {
  return linkify(text).map((s, i) => {
    if (s.type === "url") {
      return (
        <a key={i} href={s.value} target="_blank" rel="noopener noreferrer">
          {s.value}
        </a>
      );
    }
    if (s.type === "email") return <a key={i} href={`mailto:${s.value}`}>{s.value}</a>;
    return <span key={i}>{s.value}</span>;
  });
}

/** Three dots, and a reassuring note if the model is slow. */
function Thinking() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className="chat-thinking" role="status">
      <span className="chat-thinking-row">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="chat-thinking-note">{slow ? "Still working. Answers can take up to 15 seconds." : "Reading the approved profile…"}</span>
      </span>
      <span className="shim" style={{ width: "92%" }} aria-hidden="true" />
      <span className="shim" style={{ width: "64%" }} aria-hidden="true" />
    </span>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === "user") return <div className="msg msg-user">{m.text}</div>;
  const tone = m.kind === "unknown" || m.kind === "refusal" || m.kind === "error" ? " msg-note" : "";
  return (
    <div className={`msg msg-bot${tone}`}>
      {m.text ? <span className="msg-text"><Linked text={m.text} /></span> : <Thinking />}
      {m.done && m.kind === "answer" && !DECLINES.test(m.text) && m.sources && m.sources.length > 0 && (
        <p className="msg-sources">Sources: {m.sources.join(" · ")}</p>
      )}
      {m.done && m.action && (
        <a className="btn btn-primary chat-action" href={m.action.href}>
          {m.action.label}
        </a>
      )}
    </div>
  );
}

export default function ChatWidget() {
  const { messages, status, remaining, send } = useChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // New content is always brought into view. A new message scrolls smoothly; streamed words just keep the
  // start of the answer visible, so the visitor reads from the first line instead of being dropped at the end.
  const messageCount = useRef(0);
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const isNew = messages.length !== messageCount.current;
    messageCount.current = messages.length;
    const last = el.lastElementChild as HTMLElement | null;
    const bottom = el.scrollHeight - el.clientHeight;
    const answerTop = last?.classList.contains("msg-bot") ? Math.max(0, last.offsetTop - 12) : bottom;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: Math.min(bottom, answerTop), behavior: isNew && !still ? "smooth" : "auto" });
  }, [messages, open]);

  const busy = status !== "idle";

  // Starter questions are drawn at random, and swapped for a fresh set now and then until the visitor
  // touches the chat. They stop moving the moment someone types or asks, so a button never shifts under a tap.
  const [seed, setSeed] = useState(0);
  const asked = useMemo(() => messages.filter((m) => m.role === "user").map((m) => m.text), [messages]);
  const hasAsked = asked.length > 0;
  const picks = useMemo(
    () => pickSuggestions(suggestionPool, asked, hasAsked ? 2 : 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, asked.length]
  );
  useEffect(() => {
    if (!open || hasAsked || input) return;
    const t = setInterval(() => setSeed((n) => n + 1), ROTATE_MS);
    return () => clearInterval(t);
  }, [open, hasAsked, input]);

  async function submit(text: string) {
    // Clear the box as soon as the question is sent, so the text is not left sitting there while
    // the answer loads. If the question is rejected, put it back so it can be edited.
    setError("");
    setInput("");
    const problem = await send(text);
    if (problem) {
      setError(problem);
      setInput(text);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(input);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          className="chat-launcher"
          type="button"
          onClick={() => {
            setSeed((n) => n + 1);
            setOpen(true);
          }}
          aria-expanded={false}
          aria-controls="chat-panel"
        >
          <Spark />
          <span className="chat-launcher-long">Ask AI about me</span>
          <span className="chat-launcher-short">Ask AI</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            id="chat-panel"
            className="chat-panel"
            role="dialog"
            aria-label={`Chat about ${profile.name}`}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="chat-head">
              <div>
                <strong>
                  <Spark /> Ask AI <small>about {profile.name.split(" ")[0]}'s work</small>
                </strong>
                <span>Answers come from approved profile content</span>
              </div>
              <button className="icon-btn" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                ✕
              </button>
            </header>

            <div className="chat-log" ref={logRef} role="log" aria-live="polite" aria-busy={busy}>
              <div className="msg msg-bot">
                Hi, I can answer questions about {profile.name}'s experience, projects, skills and availability. What would you like to know?
              </div>
              {messages.map((m) => (
                <Bubble key={m.id} m={m} />
              ))}
            </div>

            {!busy && picks.length > 0 && (
              <div className="chat-suggest" role="group" aria-label={hasAsked ? "Ask next" : "Questions to try"}>
                <p className="chat-suggest-label">{hasAsked ? "Ask next" : "Curious about"}</p>
                {picks.map((q) => (
                  <button key={q} type="button" className="chip" onClick={() => void submit(q)}>
                    <span>{q}</span>
                    <span className="chip-go" aria-hidden="true">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-error" role="alert">
              {error}
            </div>
            <form className="chat-form" onSubmit={onSubmit} noValidate>
              <label className="sr-only" htmlFor="chat-input">
                Your question
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                value={input}
                maxLength={MAX_QUESTION_CHARS}
                autoComplete="off"
                placeholder="Ask about projects, skills, visa…"
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError("");
                }}
              />
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "..." : "Send"}
              </button>
            </form>
            <p className="chat-foot">
              {remaining} question{remaining === 1 ? "" : "s"} left in this session. Greetings and quick replies do not count. AI-generated from {profile.name}'s profile. This site does not store your questions.
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
