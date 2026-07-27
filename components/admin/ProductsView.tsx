"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Tags,
  FolderTree,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  api,
  ApiError,
  Spinner,
  ErrorState,
  PageHeader,
  Modal,
  useToast,
  formatLKR,
} from "./ui";
import { useMe } from "./MeProvider";
import { can } from "@/lib/admin/types";

type Variant = {
  id?: string;
  model: string;
  filtration: string | null;
  recommended_for: string | null;
  filter_stages: string | null;
  price: number;
  plus_vat: boolean;
  position: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
};

type Tag = { id: string; name: string; slug: string };

type Product = {
  id: string;
  slug: string;
  name: string;
  series: string | null;
  form: string | null;
  blurb: string | null;
  images: string[];
  pdf_url: string | null;
  features: { title: string; body: string }[];
  specs: { label: string; value: string }[];
  is_published: boolean;
  position: number;
  category_id: string | null;
  product_variants: Variant[];
  product_tag_links: { tag_id: string }[];
};

type VariantForm = {
  model: string;
  filtration: string;
  recommendedFor: string;
  filterStages: string;
  price: string;
  plusVat: boolean;
};

type Form = {
  name: string;
  slug: string;
  series: string;
  form: string;
  blurb: string;
  categoryId: string;
  tagIds: string[];
  images: string[];
  pdfUrl: string;
  features: { title: string; body: string }[];
  specs: { label: string; value: string }[];
  variants: VariantForm[];
  isPublished: boolean;
};

const emptyVariant: VariantForm = {
  model: "",
  filtration: "",
  recommendedFor: "",
  filterStages: "",
  price: "",
  plusVat: false,
};

const emptyForm: Form = {
  name: "",
  slug: "",
  series: "",
  form: "",
  blurb: "",
  categoryId: "",
  tagIds: [],
  images: [],
  pdfUrl: "",
  features: [],
  specs: [],
  variants: [{ ...emptyVariant }],
  isPublished: false,
};

const input =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green";
const label =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

export default function ProductsView() {
  const me = useMe();
  const toast = useToast();
  const mayCreate = me ? can(me, "can_create_products") : false;
  const mayEdit = me ? can(me, "can_edit_products") : false;
  const mayDelete = me ? can(me, "can_delete_products") : false;

  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editor, setEditor] = useState<
    { mode: "add" } | { mode: "edit"; product: Product } | null
  >(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const [managingCategories, setManagingCategories] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{
        products: Product[];
        categories: Category[];
        tags: Tag[];
      }>("/api/admin/products");
      setProducts(data.products);
      setCategories(data.categories ?? []);
      setTags(data.tags ?? []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upd = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? null;

  /* ---------- product editor ---------- */

  const openAdd = () => {
    setForm(emptyForm);
    setEditor({ mode: "add" });
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      slug: product.slug,
      series: product.series ?? "",
      form: product.form ?? "",
      blurb: product.blurb ?? "",
      categoryId: product.category_id ?? "",
      tagIds: (product.product_tag_links ?? []).map((l) => l.tag_id),
      images: product.images ?? [],
      pdfUrl: product.pdf_url ?? "",
      features: product.features ?? [],
      specs: product.specs ?? [],
      variants: [...(product.product_variants ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((v) => ({
          model: v.model,
          filtration: v.filtration ?? "",
          recommendedFor: v.recommended_for ?? "",
          filterStages: v.filter_stages ?? "",
          price: v.price != null ? String(v.price) : "",
          plusVat: v.plus_vat,
        })),
      isPublished: product.is_published,
    });
    setEditor({ mode: "edit", product });
  };

  const save = async () => {
    if (!editor || busy || !form.name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name,
        series: form.series,
        form: form.form,
        blurb: form.blurb,
        categoryId: form.categoryId || null,
        tagIds: form.tagIds,
        images: form.images,
        pdfUrl: form.pdfUrl,
        features: form.features,
        specs: form.specs,
        variants: form.variants,
        isPublished: form.isPublished,
      };
      if (editor.mode === "add") {
        await api("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editor.product.id }),
        });
      }
      setEditor(null);
      await load();
      toast("Product saved.", "success");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (product: Product) => {
    try {
      await api("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isPublished: !product.is_published,
        }),
      });
      toast(
        product.is_published
          ? `"${product.name}" is hidden from the shop.`
          : `"${product.name}" is live on the shop.`,
        "success"
      );
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const remove = async (product: Product) => {
    if (
      !confirm(
        `Delete "${product.name}"? Past orders keep their own record, so order history isn't affected.`
      )
    )
      return;
    try {
      await api(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  /* ---------- images ---------- */

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Upload failed.");
      upd("images", [...form.images, data.url]);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const next = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    upd("images", next);
  };

  /* ---------- categories & tags ---------- */

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await api("/api/admin/products/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewCategory("");
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const renameCategory = async (category: Category, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) return;
    try {
      await api("/api/admin/products/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, name: trimmed }),
      });
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const removeCategory = async (category: Category) => {
    const used = (products ?? []).filter(
      (p) => p.category_id === category.id
    ).length;
    if (
      !confirm(
        used > 0
          ? `${used} ${used === 1 ? "product is" : "products are"} in "${category.name}". They'll stay in the shop but without a category. Delete it?`
          : `Delete the category "${category.name}"?`
      )
    )
      return;
    try {
      await api(`/api/admin/products/categories?id=${category.id}`, {
        method: "DELETE",
      });
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    try {
      await api("/api/admin/products/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewTag("");
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const removeTag = async (tag: Tag) => {
    if (!confirm(`Delete the tag "${tag.name}"? It's removed from every product.`))
      return;
    try {
      await api(`/api/admin/products/tags?id=${tag.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  /* ---------- render ---------- */

  if (loading) return <Spinner />;
  if (error || !products) {
    return (
      <>
        <PageHeader title="Products" />
        <ErrorState error={error ?? new Error("No data")} onRetry={load} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Products"
        sub="What customers see in the shop. Drafts stay hidden until you publish them."
      >
        <div className="flex flex-wrap items-center gap-2">
          {mayEdit && (
            <>
              <button
                onClick={() => setManagingCategories(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <FolderTree className="size-4" /> Categories
              </button>
              <button
                onClick={() => setManagingTags(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Tags className="size-4" /> Tags
              </button>
            </>
          )}
          {mayCreate && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="size-4" /> Add product
            </button>
          )}
        </div>
      </PageHeader>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
          <p className="text-slate-500">
            No products yet. Add your first one and it will appear in the shop
            once you publish it.
          </p>
          {mayCreate && (
            <button
              onClick={openAdd}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="size-4" /> Add product
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const prices = (product.product_variants ?? [])
              .map((v) => Number(v.price))
              .filter((p) => p > 0);
            const productTags = (product.product_tag_links ?? [])
              .map((l) => tags.find((t) => t.id === l.tag_id))
              .filter((t): t is Tag => !!t);
            return (
              <li
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[4/3] bg-slate-50">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-300">
                      No image
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ring-1 ${
                      product.is_published
                        ? "bg-green/10 text-green ring-green/30"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    {product.is_published ? "Live" : "Draft"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs text-slate-400">
                    {categoryName(product.category_id) ?? "No category"}
                  </p>
                  <h3 className="mt-0.5 text-sm font-semibold text-slate-800">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {prices.length > 0
                      ? `From ${formatLKR(Math.min(...prices))}`
                      : "No price set"}
                    {" · "}
                    {product.product_variants?.length ?? 0}{" "}
                    {product.product_variants?.length === 1 ? "model" : "models"}
                  </p>

                  {productTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {productTags.map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-medium text-slate-500"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                    {mayEdit && (
                      <button
                        onClick={() => togglePublished(product)}
                        aria-label={
                          product.is_published
                            ? `Hide ${product.name}`
                            : `Publish ${product.name}`
                        }
                        title={
                          product.is_published
                            ? "Hide from the shop"
                            : "Publish to the shop"
                        }
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        {product.is_published ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    )}
                    {mayEdit && (
                      <button
                        onClick={() => openEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                    {mayDelete && (
                      <button
                        onClick={() => remove(product)}
                        aria-label={`Delete ${product.name}`}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* product editor */}
      {editor && (
        <Modal
          title={editor.mode === "add" ? "Add product" : "Edit product"}
          size="xl"
          align="start"
          onClose={() => setEditor(null)}
        >
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Name *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => upd("name", e.target.value)}
                  placeholder="Lusako Inline Water Purifier"
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Web address</label>
                <input
                  value={form.slug}
                  onChange={(e) => upd("slug", e.target.value)}
                  placeholder="left blank = made from the name"
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => upd("categoryId", e.target.value)}
                  className={input}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Series</label>
                  <input
                    value={form.series}
                    onChange={(e) => upd("series", e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Form</label>
                  <input
                    value={form.form}
                    onChange={(e) => upd("form", e.target.value)}
                    placeholder="Floor-standing"
                    className={input}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Short description</label>
                <textarea
                  value={form.blurb}
                  onChange={(e) => upd("blurb", e.target.value)}
                  rows={2}
                  placeholder="One or two sentences, shown on the shop card."
                  className={`${input} resize-none`}
                />
              </div>
            </section>

            {/* tags */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Tags</h3>
              {tags.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No tags yet — create some under <strong>Tags</strong> and
                  they&apos;ll become filters on the shop page.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const on = form.tagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          upd(
                            "tagIds",
                            on
                              ? form.tagIds.filter((x) => x !== t.id)
                              : [...form.tagIds, t.id]
                          )
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          on
                            ? "bg-green text-white"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* images */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Photos
              </h3>
              <div className="flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div
                    key={url}
                    className="group relative size-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`Photo ${i + 1}`}
                      fill
                      sizes="96px"
                      className="object-contain p-1.5"
                    />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase text-white">
                        Main
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="Move photo earlier"
                        className="grid size-6 place-items-center text-slate-500 disabled:opacity-25"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          upd(
                            "images",
                            form.images.filter((x) => x !== url)
                          )
                        }
                        aria-label="Remove photo"
                        className="grid size-6 place-items-center text-red-500"
                      >
                        <X className="size-3.5" />
                      </button>
                      <button
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                        aria-label="Move photo later"
                        className="grid size-6 place-items-center text-slate-500 disabled:opacity-25"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="grid size-24 place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-green hover:text-green disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Upload className="size-5" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                The first photo is the one shown on the shop card. Max 5 MB each.
              </p>
            </section>

            {/* variants */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  Models &amp; prices
                </h3>
                <button
                  onClick={() =>
                    upd("variants", [...form.variants, { ...emptyVariant }])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-green hover:underline"
                >
                  <Plus className="size-3.5" /> Add model
                </button>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                What a customer actually buys. Every basket is re-priced from
                here at checkout, so these are the prices that count.
              </p>
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={v.model}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i ? { ...x, model: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Model name *"
                        className={input}
                      />
                      <input
                        value={v.price}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i ? { ...x, price: e.target.value } : x
                            )
                          )
                        }
                        type="number"
                        placeholder="Price (Rs)"
                        className={input}
                      />
                      <button
                        onClick={() =>
                          upd(
                            "variants",
                            form.variants.filter((_, j) => j !== i)
                          )
                        }
                        aria-label="Remove this model"
                        className="grid size-11 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        value={v.filtration}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i ? { ...x, filtration: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Filtration (UF / RO)"
                        className={input}
                      />
                      <input
                        value={v.recommendedFor}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i
                                ? { ...x, recommendedFor: e.target.value }
                                : x
                            )
                          )
                        }
                        placeholder="Recommended for"
                        className={input}
                      />
                      <input
                        value={v.filterStages}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i
                                ? { ...x, filterStages: e.target.value }
                                : x
                            )
                          )
                        }
                        placeholder="Filter stages"
                        className={input}
                      />
                    </div>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={v.plusVat}
                        onChange={(e) =>
                          upd(
                            "variants",
                            form.variants.map((x, j) =>
                              j === i ? { ...x, plusVat: e.target.checked } : x
                            )
                          )
                        }
                        className="size-4 accent-green"
                      />
                      Price is before VAT
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* features */}
            <PairEditor
              title="Highlights"
              hint="Bullet points on the product page."
              rows={form.features}
              keys={["title", "body"]}
              placeholders={["Headline", "Explanation"]}
              onChange={(rows) =>
                upd("features", rows as { title: string; body: string }[])
              }
            />

            {/* specs */}
            <PairEditor
              title="Specification table"
              hint="One row per line of the spec sheet."
              rows={form.specs}
              keys={["label", "value"]}
              placeholders={["Capacity", "10 L/h"]}
              onChange={(rows) =>
                upd("specs", rows as { label: string; value: string }[])
              }
            />

            <section className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Spec sheet PDF link</label>
                <input
                  value={form.pdfUrl}
                  onChange={(e) => upd("pdfUrl", e.target.value)}
                  placeholder="https://…"
                  className={input}
                />
              </div>
              <label className="flex items-end gap-2.5 pb-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => upd("isPublished", e.target.checked)}
                  className="size-4 accent-green"
                />
                Show this product in the shop
              </label>
            </section>
          </div>

          <button
            onClick={save}
            disabled={busy || !form.name.trim()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {editor.mode === "add" ? "Create product" : "Save changes"}
          </button>
        </Modal>
      )}

      {/* categories */}
      {managingCategories && (
        <Modal
          title="Categories"
          sub="Each product sits in one category."
          onClose={() => setManagingCategories(false)}
        >
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400">No categories yet.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((c) => {
                const used = products.filter(
                  (p) => p.category_id === c.id
                ).length;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5"
                  >
                    <input
                      defaultValue={c.name}
                      onBlur={(e) => renameCategory(c, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      aria-label={`Rename ${c.name}`}
                      className="min-w-0 flex-1 rounded-lg border border-transparent px-2.5 py-1.5 text-sm outline-none transition hover:border-slate-200 focus:border-green"
                    />
                    <span className="shrink-0 text-xs text-slate-400">
                      {used}
                    </span>
                    <button
                      onClick={() => removeCategory(c)}
                      aria-label={`Delete ${c.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCategory();
              }}
              placeholder="New category name"
              className={input}
            />
            <button
              onClick={addCategory}
              disabled={!newCategory.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Modal>
      )}

      {/* tags */}
      {managingTags && (
        <Modal
          title="Tags"
          sub="Customers filter the shop by these."
          onClose={() => setManagingTags(false)}
        >
          {tags.length === 0 ? (
            <p className="text-sm text-slate-400">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm text-slate-700"
                >
                  {t.name}
                  <button
                    onClick={() => removeTag(t)}
                    aria-label={`Delete ${t.name}`}
                    className="grid size-5 place-items-center rounded-full text-slate-400 transition hover:bg-red-100 hover:text-red-500"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag();
              }}
              placeholder="New tag, e.g. Hot & cold"
              className={input}
            />
            <button
              onClick={addTag}
              disabled={!newTag.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* Two-column repeating rows — used for both the highlights and the spec
   table, which have the same shape. */
function PairEditor({
  title,
  hint,
  rows,
  keys,
  placeholders,
  onChange,
}: {
  title: string;
  hint: string;
  rows: Record<string, string>[];
  keys: [string, string];
  placeholders: [string, string];
  onChange: (rows: Record<string, string>[]) => void;
}) {
  const set = (i: number, key: string, value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <button
          onClick={() => onChange([...rows, { [keys[0]]: "", [keys[1]]: "" }])}
          className="inline-flex items-center gap-1 text-xs font-medium text-green hover:underline"
        >
          <Plus className="size-3.5" /> Add row
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">{hint}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-300">Nothing added yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
              <input
                value={row[keys[0]] ?? ""}
                onChange={(e) => set(i, keys[0], e.target.value)}
                placeholder={placeholders[0]}
                className={input}
              />
              <input
                value={row[keys[1]] ?? ""}
                onChange={(e) => set(i, keys[1], e.target.value)}
                placeholder={placeholders[1]}
                className={input}
              />
              <button
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                aria-label="Remove row"
                className="grid size-11 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
