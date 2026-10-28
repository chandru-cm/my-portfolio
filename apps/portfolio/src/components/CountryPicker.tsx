import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { countries, searchCountries, suggestedCountries, type Country } from "@my-portfolio/content";

type Props = {
  /** ISO code of the selected country, for example "IN". */
  value: string;
  onChange: (iso: string) => void;
  /** The visitor's own country, shown first in the suggestions. */
  guess: string;
};

/**
 * A compact country-code picker. Closed, it is a small "IN +91" button. Open, it is a searchable list: type a name,
 * a code or a letter, and use the arrow keys and Enter, or tap. It follows the ARIA combobox pattern, so a screen
 * reader hears the same list a sighted visitor sees. It replaces a native select, whose 59-line popup cannot be
 * searched or styled.
 */
export default function CountryPicker({ value, onChange, guess }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const current = countries.find((c) => c.iso === value) ?? countries[0];
  const suggested = useMemo(() => suggestedCountries(guess), [guess]);
  const searching = query.trim() !== "";
  const found = useMemo(() => (searching ? searchCountries(query) : []), [searching, query]);
  // One flat list is what the arrow keys walk through: suggestions, then everyone (or just the matches while searching).
  const options: Country[] = searching ? found : [...suggested, ...countries];

  function show() {
    setQuery("");
    setActive(Math.max(0, [...suggested, ...countries].findIndex((c) => c.iso === value)));
    setOpen(true);
  }
  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }
  function choose(c: Country) {
    onChange(c.iso);
    close();
  }

  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
    };
  }, [open]);

  // Keep the highlighted row in view as the arrow keys move it.
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[active]) choose(options[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  const row = (c: Country, index: number) => (
    <li
      key={`${index}-${c.iso}`}
      id={optId(index)}
      role="option"
      aria-selected={c.iso === value}
      data-active={index === active}
      className="cp-opt"
      onMouseEnter={() => setActive(index)}
      // mousedown, not click: the search box must not lose focus before the choice registers.
      onMouseDown={(e) => {
        e.preventDefault();
        choose(c);
      }}
    >
      <span className="cp-name">{c.name}</span>
      <span className="cp-dial">{c.dial}</span>
      {c.iso === value && (
        <span className="cp-tick" aria-hidden="true">
          ✓
        </span>
      )}
    </li>
  );

  return (
    <div className="cp" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="cp-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${current.name} ${current.dial}. Change`}
        onClick={() => (open ? close() : show())}
      >
        <span className="cp-iso">{current.iso}</span>
        <span>{current.dial}</span>
        <span className="cp-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="cp-pop">
          <input
            ref={search}
            className="cp-search"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={options[active] ? optId(active) : undefined}
            aria-label="Search countries"
            placeholder="Search country or code"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          <ul id={listId} role="listbox" aria-label="Countries" className="cp-list" ref={list}>
            {searching ? (
              found.length ? (
                found.map((c, i) => row(c, i))
              ) : (
                <li className="cp-empty" role="presentation">
                  No country matches “{query.trim()}”.
                </li>
              )
            ) : (
              <>
                <li className="cp-head" role="presentation">
                  Suggested
                </li>
                {suggested.map((c, i) => row(c, i))}
                <li className="cp-head" role="presentation">
                  All countries
                </li>
                {countries.map((c, i) => row(c, suggested.length + i))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
