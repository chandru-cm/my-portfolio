import { useEffect, useRef, useState } from "react";

type Props = { email: string };

/** Copies the email address. mailto: links do nothing on computers without a mail app. */
export default function CopyEmail({ email }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      // Clipboard API blocked (insecure context or permissions): fall back to a selection copy.
      const field = document.createElement("textarea");
      field.value = email;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      field.remove();
    }
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <button className="btn" type="button" onClick={copy}>
        {state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C to copy" : "Copy email"}
      </button>
      <span className="sr-only" role="status">
        {state === "copied" ? "Email address copied to the clipboard" : state === "failed" ? "Could not copy. Select the address and copy it manually." : ""}
      </span>
    </>
  );
}
