import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { normalizePhone, profile } from "@my-portfolio/content";
import CountryPicker from "./CountryPicker";
import Cta from "./Cta";
import {
  CALL_ZONES,
  CHANNEL_LABEL,
  CONTACT_CHANNELS,
  CONTACT_TOPICS,
  dialFor,
  makeDraft,
  sendContact,
  toPayload,
  validateDraft,
  type ContactDraft,
  type ContactKind,
  type Receipt,
} from "../lib/contact";
import { CONTACT_ENDPOINT } from "../lib/site";

type Status = "idle" | "sending" | "sent";

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Show the sending screen for at least this long, so a fast reply never makes it flash. */
const MIN_SENDING_MS = 900;

/**
 * Sends a message or a call request to the owner's inbox through /api/contact.
 *
 * While it sends, the form is replaced by a calm progress screen: a moving bar, a short checklist, and a note that
 * appears if the wait is long. The card keeps the form's height, so the page does not jump. The visitor's text stays
 * in memory, so a failure brings the form back exactly as it was, with the reason and a way to email instead.
 */
export default function ContactForm() {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const openedAt = useRef(Date.now());
  const guess = useRef("");
  const trap = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [draft, setDraft] = useState<ContactDraft>(() => makeDraft());
  if (!guess.current) guess.current = draft.country;
  const [status, setStatus] = useState<Status>("idle");
  const [receipt, setReceipt] = useState<Receipt>("off");
  const [elapsed, setElapsed] = useState(0);
  const [lockedHeight, setLockedHeight] = useState(0);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  // Bumped on every error so the message shakes again even when the text is the same.
  const [errorKey, setErrorKey] = useState(0);

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const call = draft.kind === "call";
  const needsPhone = draft.channel !== "email";

  // Time spent sending, for the progress wording. It only runs while a send is in flight.
  useEffect(() => {
    if (status !== "sending") return;
    const t0 = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Date.now() - t0), 250);
    return () => clearInterval(timer);
  }, [status]);

  // Move focus to the new heading so a screen reader announces what changed, and a keyboard user is not left on a button that vanished.
  useEffect(() => {
    if (status !== "idle") headingRef.current?.focus();
  }, [status]);

  // When a send fails, the form comes back. Bring the reason into view, which matters on a phone where it sits below the fold.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [errorKey, error]);

  function fail(message: string, showEmail = false) {
    setError(message);
    setFallback(showEmail);
    setErrorKey((k) => k + 1);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    const problem = validateDraft(draft);
    if (problem) return fail(problem);

    // Read these before the form is swapped out: the hidden field and the card's height live in the form.
    const trapValue = trap.current?.value ?? "";
    setLockedHeight(formRef.current?.offsetHeight ?? 0);
    setError("");
    setFallback(false);
    setStatus("sending");

    const started = Date.now();
    const result = await sendContact(CONTACT_ENDPOINT, toPayload(draft, trapValue, started - openedAt.current));
    const remaining = MIN_SENDING_MS - (Date.now() - started);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

    if (result.ok) {
      setReceipt(result.receipt);
      setStatus("sent");
      return;
    }
    setStatus("idle");
    fail(result.message, result.fallback);
  }

  function again() {
    setDraft(makeDraft());
    setStatus("idle");
    setReceipt("off");
    setError("");
    setFallback(false);
    setLockedHeight(0);
    openedAt.current = Date.now();
  }

  const heightStyle = lockedHeight ? { minHeight: lockedHeight } : undefined;

  if (status === "sending") {
    const checked = elapsed >= 700;
    const note =
      elapsed < 6000
        ? ""
        : elapsed < 14000
          ? "Email servers can take a few seconds. Still sending…"
          : "This is taking longer than usual. Still trying, so please keep this page open.";
    return (
      <div className="cform cform-busy" role="status" aria-live="polite" aria-busy="true" style={heightStyle}>
        <div className="cform-bar" aria-hidden="true">
          <i />
        </div>
        <h3 ref={headingRef} tabIndex={-1}>
          Sending your message
        </h3>
        <p className="cform-to">
          To {profile.name} · {call ? "Call request" : draft.topic}
        </p>
        <ol className="cform-steps">
          <li data-state={checked ? "done" : "active"}>
            <span className="cform-dot" aria-hidden="true" />
            Checking your details
          </li>
          <li data-state={checked ? "active" : "wait"}>
            <span className="cform-dot" aria-hidden="true" />
            Delivering to my inbox
          </li>
        </ol>
        <p className="cform-wait">{note}</p>
      </div>
    );
  }

  if (status === "sent") {
    const phone = draft.phone.trim() ? normalizePhone({ dial: dialFor(draft.country), number: draft.phone }) : null;
    const replyBy = draft.channel !== "email" && phone && phone.ok ? `by ${CHANNEL_LABEL[draft.channel]} on ${phone.phone.display}` : `by email at ${draft.email.trim()}`;
    return (
      <div className="cform cform-done" role="status" style={heightStyle}>
        <span className="cform-check" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 ref={headingRef} tabIndex={-1}>
          Message sent
        </h3>
        <ul className="cform-steps">
          <li data-state="done">
            <span className="cform-dot" aria-hidden="true" />
            Delivered to my inbox
          </li>
          {receipt === "sent" && (
            <li data-state="done">
              <span className="cform-dot" aria-hidden="true" />
              Receipt sent to {draft.email.trim()}
            </li>
          )}
          {receipt === "failed" && (
            <li data-state="skip">
              <span className="cform-dot" aria-hidden="true" />
              The receipt email could not be sent, but your message reached me
            </li>
          )}
        </ul>
        <p>
          I reply within {profile.replyTime}, {replyBy}.
        </p>
        <button type="button" className="btn" onClick={again}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="cform" ref={formRef} onSubmit={onSubmit} noValidate aria-label="Contact form">
      <div className="seg cform-kind" role="group" aria-label="What would you like to do">
        {(["message", "call"] as ContactKind[]).map((k) => (
          <button key={k} type="button" aria-pressed={draft.kind === k} onClick={() => set("kind", k)}>
            {k === "message" ? "Send a message" : "Request a call"}
          </button>
        ))}
      </div>

      <div className="cform-row">
        <div className="field">
          <label htmlFor={id("name")}>Your name</label>
          <input id={id("name")} type="text" autoComplete="name" value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor={id("email")}>Email</label>
          <input id={id("email")} type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(e) => set("email", e.target.value)} maxLength={254} />
        </div>
      </div>

      <fieldset className="field cform-topics">
        <legend>Best way to reach me</legend>
        <div className="seg">
          {CONTACT_CHANNELS.map((c) => (
            <button key={c} type="button" aria-pressed={draft.channel === c} onClick={() => set("channel", c)}>
              {CHANNEL_LABEL[c]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={id("phone")}>{needsPhone ? "Phone number" : "Phone number (optional)"}</label>
        <div className="cform-phone">
          <CountryPicker value={draft.country} onChange={(iso) => set("country", iso)} guess={guess.current} />
          <input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98765 43210"
            maxLength={20}
          />
        </div>
        <small className="cform-hint">Only used to reach you about this message. Never shared.</small>
      </div>

      {call && (
        <div className="cform-row cform-row-3">
          <div className="field">
            <label htmlFor={id("date")}>Preferred date</label>
            <input id={id("date")} type="date" min={todayIso()} value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={id("time")}>Time</label>
            <input id={id("time")} type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={id("zone")}>Your time zone</label>
            <select id={id("zone")} value={draft.timeZone} onChange={(e) => set("timeZone", e.target.value)}>
              {CALL_ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <fieldset className="field cform-topics">
        <legend>About</legend>
        <div className="seg">
          {CONTACT_TOPICS.map((t) => (
            <button key={t} type="button" aria-pressed={draft.topic === t} onClick={() => set("topic", t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={id("message")}>{call ? "What would you like to discuss?" : "Message"}</label>
        <textarea
          id={id("message")}
          rows={4}
          value={draft.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder={call ? "The role, the team, and anything I should read before we talk" : "Role, team, and anything I should read first"}
          maxLength={2000}
        />
      </div>

      {/* Honeypot: invisible and unreachable for people, tempting for bots. */}
      <div className="cform-trap" aria-hidden="true">
        <label>
          Website
          <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p key={errorKey} ref={errorRef} className="cform-error" role="alert">
          {error}
          {fallback && (
            <>
              {" "}
              <Cta kind="mail" email={profile.email} variant="link" hint={false}>
                Email me instead
              </Cta>
            </>
          )}
        </p>
      )}

      <button type="submit" className="btn btn-primary cform-send">
        {call ? "Request the call" : "Send message"}
      </button>
      <p className="cform-note">No account needed. Your email is only used to reply.</p>
    </form>
  );
}
