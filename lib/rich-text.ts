/* Sanitiser for the admin's rich-text fields (currently the product
   description and each Highlight's explanation).

   The content is written by signed-in admins, so this is not the primary
   line of defence — but it is the only one between a compromised admin
   account and a stored XSS on a public page, and it is cheap. Runs on the
   server before the value is written, and again before it is rendered.

   Deliberately an allow-list: anything not named here is dropped, tag and
   attribute alike. No dependency — the tag vocabulary the editor can
   produce is small and fixed. */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "a",
  "blockquote",
]);

// Only on <a>. Everything else — including every on* handler and `style` —
// is stripped, which is what closes the injection routes that matter.
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
};

function safeHref(value: string) {
  const v = value.trim();
  // Blocks javascript:, data:, vbscript: and friends while allowing the
  // relative and mailto/tel links the client actually uses.
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ? v : "";
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";

  let html = String(input);

  // Remove whole elements whose *content* is dangerous, not just their tags.
  html = html.replace(
    /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1>/gi,
    ""
  );
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  html = html.replace(
    /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_all, closing: string | undefined, rawName: string, rawAttrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;

      const allowed = ALLOWED_ATTRS[tag];
      if (!allowed) return `<${tag}>`;

      const attrs: string[] = [];
      const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rawAttrs))) {
        const name = m[1].toLowerCase();
        if (!allowed.has(name)) continue;
        let value = m[3] ?? m[4] ?? "";
        if (name === "href") {
          value = safeHref(value);
          if (!value) continue;
        }
        attrs.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
      }
      // External links get the usual hardening.
      if (tag === "a" && attrs.some((a) => a.startsWith('href="http'))) {
        attrs.push('target="_blank"', 'rel="noopener noreferrer"');
      }
      return `<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>`;
    }
  );

  return html.trim();
}

/* True when the value has no visible content — an empty editor still
   posts markup like "<p><br></p>", which should be stored as null rather
   than rendering an empty paragraph on the product page. */
export function isBlankHtml(html: string | null | undefined) {
  if (!html) return true;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim() === ""
  );
}

/* Plain text, for meta descriptions and OG tags built from rich content. */
export function htmlToText(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<\/(p|h3|h4|li|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}
