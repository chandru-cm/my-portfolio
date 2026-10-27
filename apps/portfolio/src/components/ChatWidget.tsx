import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@my-portfolio/content";
import { MAX_QUESTION_CHARS, useChat, type ChatMessage } from "../hooks/useChat";
import { linkify } from "../lib/linkify";

const SUGGESTIONS = [
  `What is ${profile.name}'s tech stack?`,
  `Does ${profile.name} need visa sponsorship?`,
  `What did ${profile.name} build on RentEasify?`,
  `Which time zones can ${profile.name} work with?`,
];

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
      <span className="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="chat-thinking-note">{slow ? "Still working. Answers can take up to 15 seconds." : "Thinking"}</span>
    </span>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === "user") return <div className="msg msg-user">{m.text}</div>;
  const tone = m.kind === "unknown" || m.kind === "refusal" || m.kind === "error" ? " msg-note" : "";
  return (
    <div className={`msg msg-bot${tone}`}>
      {m.text ? <span className="msg-text"><Linked text={m.text} /></span> : <Thinking />}
      {m.done && m.kind === "answer" && m.sources && m.sources.length > 0 && (
        <p className="msg-sources">Sources: {m.sources.join(" · ")}</p>
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

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const busy = status !== "idle";
  const hasAsked = messages.length > 0;

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
          onClick={() => setOpen(true)}
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

            {!hasAsked && (
              <div className="chat-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => void submit(s)}>
                    {s}
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
              {remaining} question{remaining === 1 ? "" : "s"} left in this session. AI-generated from {profile.name}'s profile. This site does not store your questions.
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
