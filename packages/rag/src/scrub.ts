const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Replaces any email address other than the real one, so a model can never invent a contact address. */
export function scrubEmails(text: string, allowed: string): string {
  return text.replace(EMAIL, (found) => (found.toLowerCase() === allowed.toLowerCase() ? found : allowed));
}

/**
 * The same check for streamed text. An address can arrive split across fragments, so the unfinished
 * last word is held back until the next fragment (or the end) shows whether it is an address.
 */
export class EmailScrubber {
  private tail = "";

  constructor(private readonly allowed: string) {}

  push(fragment: string): string {
    const text = this.tail + fragment;
    const cut = text.search(/\S*$/);
    this.tail = text.slice(cut);
    return scrubEmails(text.slice(0, cut), this.allowed);
  }

  flush(): string {
    const rest = scrubEmails(this.tail, this.allowed);
    this.tail = "";
    return rest;
  }
}
