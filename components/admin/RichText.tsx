"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  Undo2,
  Eraser,
} from "lucide-react";

/* A small rich-text editor for the admin's long-copy fields.

   Built on contentEditable + document.execCommand rather than pulling in an
   editor library: the formatting vocabulary the client needs is tiny (bold,
   italic, headings, lists, links) and matches what lib/rich-text.ts allows
   through. execCommand is deprecated but is still the only API every browser
   implements consistently, and this is an internal admin tool.

   The value is HTML. It is sanitised server-side on save and again before it
   is rendered on the public page. */

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "formatBlock:<h3>", icon: Heading3, label: "Heading" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
] as const;

export default function RichText({
  value,
  onChange,
  placeholder,
  minHeight = 180,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!value);

  /* Only write into the DOM when the incoming value genuinely differs from
     what is already there. Assigning innerHTML on every keystroke would put
     the caret back at the start of the field. */
  useEffect(() => {
    const el = ref.current;
    if (el && value !== el.innerHTML) {
      el.innerHTML = value || "";
      setEmpty(!el.textContent?.trim());
    }
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    setEmpty(!el.textContent?.trim());
    onChange(el.innerHTML);
  };

  const run = (cmd: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (cmd.startsWith("formatBlock:")) {
      const tag = cmd.split(":")[1];
      // Toggle: pressing Heading on an existing heading returns it to a paragraph.
      const inHeading = document.queryCommandValue("formatBlock").toLowerCase();
      document.execCommand(
        "formatBlock",
        false,
        inHeading === "h3" ? "<p>" : tag
      );
    } else {
      document.execCommand(cmd, false);
    }
    emit();
  };

  const addLink = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const url = window.prompt("Link address", "https://");
    if (!url) return;
    document.execCommand("createLink", false, url);
    emit();
  };

  /* Paste as plain text. Pasting from Word or a browser otherwise drags in
     spans, inline styles and font tags that the sanitiser strips anyway —
     this way what you see pasted is what gets saved. */
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  };

  const btn =
    "grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800";

  return (
    <div className="rounded-xl border border-slate-200 focus-within:border-green">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 px-1.5 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t.cmd)}
            title={t.label}
            aria-label={t.label}
            className={btn}
          >
            <t.icon className="size-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          title="Add link"
          aria-label="Add link"
          className={btn}
        >
          <Link2 className="size-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("unlink")}
          title="Remove link"
          aria-label="Remove link"
          className={btn}
        >
          <Link2Off className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("removeFormat")}
          title="Clear formatting"
          aria-label="Clear formatting"
          className={btn}
        >
          <Eraser className="size-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run("undo")}
          title="Undo"
          aria-label="Undo"
          className={btn}
        >
          <Undo2 className="size-4" />
        </button>
      </div>

      <div className="relative">
        {empty && placeholder && (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-slate-300">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          style={{ minHeight }}
          className="prose-admin w-full px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}
