"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  formatDate,
} from "./ui";

type Post = {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  category: string | null;
  read_time: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  published: boolean;
  published_at: string | null;
};

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: string;
  cover_image: string;
  body: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  published: boolean;
};

const emptyForm: Form = {
  title: "",
  slug: "",
  excerpt: "",
  category: "",
  read_time: "",
  cover_image: "",
  body: "",
  meta_title: "",
  meta_description: "",
  keywords: "",
  published: false,
};

export default function BlogView() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; post: Post } | null
  >(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ posts: Post[] }>("/api/admin/blog");
      setPosts(data.posts);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditor({ mode: "add" });
  };
  const openEdit = (post: Post) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      category: post.category ?? "",
      read_time: post.read_time ?? "",
      cover_image: post.cover_image ?? "",
      body: post.body ?? "",
      meta_title: post.meta_title ?? "",
      meta_description: post.meta_description ?? "",
      keywords: (post.keywords ?? []).join(", "),
      published: post.published,
    });
    setEditor({ mode: "edit", post });
  };

  const upd = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed.");
      upd("cover_image", data.url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (busy || !form.title.trim()) return;
    setBusy(true);
    try {
      if (editor?.mode === "add") {
        await api("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (editor?.mode === "edit") {
        await api("/api/admin/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editor.post.id, ...form }),
        });
      }
      setEditor(null);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (post: Post) => {
    const prev = posts;
    setPosts(
      (list) =>
        list?.map((p) =>
          p.id === post.id ? { ...p, published: !p.published } : p
        ) ?? null
    );
    try {
      await api("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      });
    } catch (e) {
      alert((e as Error).message);
      setPosts(prev ?? null);
    }
  };

  const remove = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/blog?id=${post.id}`, { method: "DELETE" });
      setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (error || !posts) {
    return (
      <>
        <PageHeader title="Blog" sub="Write and manage articles." />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  const input =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green";
  const label =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  return (
    <>
      <PageHeader title="Blog" sub="Write and manage articles.">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <Plus className="size-4" /> New post
        </button>
      </PageHeader>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">
          No posts yet. Create your first article — it&apos;ll appear on{" "}
          <span className="font-medium text-slate-500">/blog</span> once
          published.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                {post.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300">
                    <ImageIcon className="size-8" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${
                    post.published
                      ? "bg-green text-white"
                      : "bg-slate-800/80 text-white"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                {post.category && (
                  <span className="text-xs font-medium text-green">
                    {post.category}
                  </span>
                )}
                <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-800">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {post.excerpt}
                </p>
                <p className="mt-2 text-[0.7rem] text-slate-400">
                  Updated {formatDate(post.updated_at)}
                </p>

                <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => togglePublish(post)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    {post.published ? (
                      <>
                        <EyeOff className="size-3.5" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" /> Publish
                      </>
                    )}
                  </button>
                  {post.published && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="View post"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(post)}
                    aria-label="Edit"
                    className="ml-auto grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove(post)}
                    aria-label="Delete"
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* editor */}
      {editor && (
        <div className="fixed inset-0 z-[95] grid place-items-start justify-center overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditor(null)}
          />
          <div className="relative my-4 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editor.mode === "add" ? "New post" : "Edit post"}
              </h2>
              <button
                onClick={() => setEditor(null)}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={label}>Title *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  placeholder="Article title"
                  className={input}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => upd("slug", e.target.value)}
                    placeholder="auto-from-title"
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => upd("category", e.target.value)}
                      placeholder="e.g. Air Conditioning"
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Read time</label>
                    <input
                      value={form.read_time}
                      onChange={(e) => upd("read_time", e.target.value)}
                      placeholder="4 min read"
                      className={input}
                    />
                  </div>
                </div>
              </div>

              {/* cover image */}
              <div>
                <label className={label}>Cover image</label>
                <div className="flex items-center gap-4">
                  <div className="relative grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                    {form.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.cover_image}
                        alt="cover preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-6" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      onChange={onPickFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {uploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Upload className="size-3.5" />
                      )}
                      {uploading ? "Uploading…" : "Upload image"}
                    </button>
                    {form.cover_image && (
                      <button
                        type="button"
                        onClick={() => upd("cover_image", "")}
                        className="block text-xs text-slate-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={label}>Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => upd("excerpt", e.target.value)}
                  rows={2}
                  placeholder="Short summary shown in listings and meta description fallback."
                  className={`${input} resize-none`}
                />
              </div>

              <div>
                <label className={label}>Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => upd("body", e.target.value)}
                  rows={10}
                  placeholder="Write the article. Separate paragraphs with a blank line."
                  className={`${input} resize-y font-mono text-[0.8rem] leading-relaxed`}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Separate paragraphs with a blank line.
                </p>
              </div>

              {/* SEO */}
              <details className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-600">
                  SEO metadata
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={label}>Meta title</label>
                    <input
                      value={form.meta_title}
                      onChange={(e) => upd("meta_title", e.target.value)}
                      placeholder="Defaults to the title"
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Meta description</label>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => upd("meta_description", e.target.value)}
                      rows={2}
                      placeholder="Defaults to the excerpt"
                      className={`${input} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={label}>Keywords</label>
                    <input
                      value={form.keywords}
                      onChange={(e) => upd("keywords", e.target.value)}
                      placeholder="comma, separated, keywords"
                      className={input}
                    />
                  </div>
                </div>
              </details>

              <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => upd("published", e.target.checked)}
                  className="size-4 accent-green"
                />
                <span className="text-sm font-medium text-slate-700">
                  Published{" "}
                  <span className="font-normal text-slate-400">
                    (visible on the public blog)
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditor(null)}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !form.title.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {editor.mode === "add" ? "Create post" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
