"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* react-markdown + remark-gfm are ~140 KB raw. They used to be imported
   directly by ChatWidget, which is mounted on every public page — so every
   visitor downloaded a Markdown renderer for a bubble that only exists once
   the chat panel is open. Isolated here so ChatWidget can lazy-load it. */
export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}
