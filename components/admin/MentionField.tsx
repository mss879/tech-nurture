"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, X } from "lucide-react";

/* A textarea you can @mention people in.

   Mentioning somebody shares the to-do with them: they get one
   notification and can read it, but it never becomes their job. The
   people picked here are tracked as ids alongside the text, and those ids
   are what gets saved — the prose is never re-parsed on the server, so
   renaming somebody later can't silently change who was tagged.

   The popover is anchored under the field rather than at the caret. It is
   far less code, and on a phone — where the keyboard covers the bottom
   half of the screen anyway — it is the better place for it. */

export type MentionPerson = {
  id: string;
  full_name: string | null;
  email: string;
};

export function personLabel(p: MentionPerson) {
  return p.full_name?.trim() || p.email;
}

/* The token being typed, if the caret sits at the end of one. Anchored to
   a space or the start of the text so an email address in the middle of a
   sentence doesn't open the picker. */
function activeQuery(text: string, caret: number): string | null {
  const before = text.slice(0, caret);
  const match = /(?:^|\s)@([^\s@]*)$/.exec(before);
  return match ? match[1] : null;
}

export default function MentionField({
  value,
  onChange,
  people,
  mentioned,
  onMentionedChange,
  placeholder,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  people: MentionPerson[];
  mentioned: string[];
  onMentionedChange: (ids: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return people
      .filter((p) => {
        if (mentioned.includes(p.id)) return false;
        if (!q) return true;
        return (
          personLabel(p).toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [people, query, mentioned]);

  // Keep the highlight inside the list as it shrinks under typing.
  useEffect(() => {
    setHighlight((h) => (h < matches.length ? h : 0));
  }, [matches.length]);

  const open = query !== null && matches.length > 0;

  const sync = (text: string, caret: number) => {
    onChange(text);
    setQuery(activeQuery(text, caret));
  };

  const pick = (person: MentionPerson) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = value.slice(0, caret);
    // Replace the half-typed token, not the whole word before it.
    const replaced = before.replace(/@[^\s@]*$/, `@${personLabel(person)} `);
    const next = replaced + value.slice(caret);

    onChange(next);
    onMentionedChange([...mentioned, person.id]);
    setQuery(null);

    // Put the caret back after the name we just inserted.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(replaced.length, replaced.length);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      // Enter would otherwise put a newline in the middle of a name.
      e.preventDefault();
      pick(matches[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery(null);
    }
  };

  const chosen = mentioned
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is MentionPerson => !!p);

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => sync(e.target.value, e.target.selectionStart)}
        onKeyDown={onKeyDown}
        // Clicking elsewhere in the text moves the caret out of the token.
        onClick={(e) =>
          setQuery(activeQuery(value, e.currentTarget.selectionStart))
        }
        // A plain blur would close the list before a click on it lands, so
        // the delay is what makes tapping an option work.
        onBlur={() => setTimeout(() => setQuery(null), 150)}
        className={className}
      />

      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-slate-100" : ""
                }`}
              >
                <AtSign className="size-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-slate-700">{personLabel(p)}</span>
                {p.full_name?.trim() && (
                  <span className="ml-auto truncate text-xs text-slate-400">
                    {p.email}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {chosen.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400">Looped in:</span>
          {chosen.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2 pr-1 text-xs text-slate-600"
            >
              {personLabel(p)}
              <button
                type="button"
                onClick={() =>
                  onMentionedChange(mentioned.filter((id) => id !== p.id))
                }
                aria-label={`Remove ${personLabel(p)}`}
                className="grid size-4 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
