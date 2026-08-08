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
  Building2,
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
import RichText from "./RichText";
import { SPEC_COLUMNS, whyChooseHeading } from "@/lib/products";

type Variant = {
  id?: string;
  model: string;
  option_label: string | null;
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

type Brand = { id: string; name: string; slug: string; position: number };

type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  series: string | null;
  blurb: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  key_features: string[] | null;
  why_choose: string[] | null;
  perfect_for: string[] | null;
  images: string[];
  features: { title: string; body: string }[];
  specs: { label: string; value: string }[];
  is_published: boolean;
  position: number;
  category_id: string | null;
  brand_id: string | null;
  product_variants: Variant[];
  product_tag_links: { tag_id: string }[];
};

type VariantForm = {
  model: string;
  /* "UF" / "RO" / "1.5 Ton" — what tells two models apart in the basket. */
  optionLabel: string;
  price: string;
  plusVat: boolean;
};

type Form = {
  name: string;
  subtitle: string;
  slug: string;
  series: string;
  blurb: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  brandId: string;
  tagIds: string[];
  images: string[];
  keyFeatures: string[];
  whyChoose: string[];
  perfectFor: string[];
  features: { title: string; body: string }[];
  specs: { label: string; value: string }[];
  variants: VariantForm[];
  isPublished: boolean;
};

const emptyVariant: VariantForm = {
  model: "",
  optionLabel: "",
  price: "",
  plusVat: false,
};

const emptyForm: Form = {
  name: "",
  subtitle: "",
  slug: "",
  series: "",
  blurb: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  categoryId: "",
  brandId: "",
  tagIds: [],
  images: [],
  keyFeatures: [],
  whyChoose: [],
  perfectFor: [],
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
  const [brands, setBrands] = useState<Brand[]>([]);
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
  const [managingBrands, setManagingBrands] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{
        products: Product[];
        categories: Category[];
        tags: Tag[];
        brands: Brand[];
      }>("/api/admin/products");
      setProducts(data.products);
      setCategories(data.categories ?? []);
      setTags(data.tags ?? []);
      setBrands(data.brands ?? []);
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
      subtitle: product.subtitle ?? "",
      series: product.series ?? "",
      blurb: product.blurb ?? "",
      description: product.description ?? "",
      metaTitle: product.meta_title ?? "",
      metaDescription: product.meta_description ?? "",
      keyFeatures: product.key_features ?? [],
      whyChoose: product.why_choose ?? [],
      perfectFor: product.perfect_for ?? [],
      categoryId: product.category_id ?? "",
      brandId: product.brand_id ?? "",
      tagIds: (product.product_tag_links ?? []).map((l) => l.tag_id),
      images: product.images ?? [],
      features: product.features ?? [],
      specs: product.specs ?? [],
      variants: [...(product.product_variants ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((v) => ({
          model: v.model,
          optionLabel: v.option_label ?? "",
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
        subtitle: form.subtitle,
        slug: form.slug || form.name,
        series: form.series,
        blurb: form.blurb,
        description: form.description,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        keyFeatures: form.keyFeatures,
        whyChoose: form.whyChoose,
        perfectFor: form.perfectFor,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
        tagIds: form.tagIds,
        images: form.images,
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

  const addBrand = async () => {
    const name = newBrand.trim();
    if (!name) return;
    try {
      await api("/api/admin/products/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setNewBrand("");
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const renameBrand = async (brand: Brand, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === brand.name) return;
    try {
      await api("/api/admin/products/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: brand.id, name: trimmed }),
      });
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const removeBrand = async (brand: Brand) => {
    const used = (products ?? []).filter((p) => p.brand_id === brand.id).length;
    if (
      !confirm(
        used > 0
          ? `${used} ${used === 1 ? "product is" : "products are"} under "${brand.name}". They'll stay in the shop but without a brand. Delete it?`
          : `Delete the brand "${brand.name}"?`
      )
    )
      return;
    try {
      await api(`/api/admin/products/brands?id=${brand.id}`, {
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
                onClick={() => setManagingBrands(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Building2 className="size-4" /> Brands
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
          <div className="space-y-7">
            {/* ---- AUTO DETECTIONS ---- */}
            <FormGroup
              title="Auto detections"
              hint="Worked out for you — change it only if you need a particular address."
            >
              <div>
                <label className={label}>Web address</label>
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm text-slate-400">
                    /products/
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => upd("slug", e.target.value)}
                    placeholder={
                      form.name.trim()
                        ? slugPreview(form.name)
                        : "made from the product title"
                    }
                    className={input}
                  />
                </div>
              </div>
            </FormGroup>

            {/* ---- DROP DOWNS ---- */}
            <FormGroup title="Drop downs">
              <div className="grid gap-3 sm:grid-cols-2">
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
                <div>
                  <label className={label}>Brand</label>
                  <select
                    value={form.brandId}
                    onChange={(e) => upd("brandId", e.target.value)}
                    className={input}
                  >
                    <option value="">No brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={label}>Tags</label>
                {tags.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No tags yet — create some under <strong>Tags</strong>.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => {
                      const on = form.tagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
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
              </div>
            </FormGroup>

            {/* ---- PICTURES ---- */}
            <FormGroup
              title="Pictures"
              hint="The first picture is the one shown on the shop card. Max 5 MB each."
            >
              <div className="flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div
                    key={url}
                    className="group relative size-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`Picture ${i + 1}`}
                      fill
                      sizes="96px"
                      className="object-contain p-1.5"
                    />
                    <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase text-white">
                      {i === 0 ? "Main" : `Pic ${i + 1}`}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="Move picture earlier"
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
                        aria-label="Remove picture"
                        className="grid size-6 place-items-center text-red-500"
                      >
                        <X className="size-3.5" />
                      </button>
                      <button
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                        aria-label="Move picture later"
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
            </FormGroup>

            {/* ---- TITLE ---- */}
            <FormGroup title="Title">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Series</label>
                  <input
                    value={form.series}
                    onChange={(e) => upd("series", e.target.value)}
                    placeholder="2905"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Product title *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => upd("name", e.target.value)}
                    placeholder="AquaElite 3X"
                    className={input}
                  />
                </div>
              </div>
              <div>
                <label className={label}>Product sub title</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => upd("subtitle", e.target.value)}
                  placeholder="Premium Countertop Hot, Cold & Normal Water Purifier"
                  className={input}
                />
              </div>
              <div>
                <label className={label}>SEO meta title</label>
                <input
                  value={form.metaTitle}
                  onChange={(e) => upd("metaTitle", e.target.value)}
                  placeholder="LUSAKO AquaElite 3X Countertop Water Purifier | Hot, Cold & Normal Water"
                  className={input}
                />
                <CharCount value={form.metaTitle} ideal={60} />
              </div>
            </FormGroup>

            {/* ---- DESCRIPTION ---- */}
            <FormGroup title="Description">
              <div>
                <label className={label}>Short description</label>
                <textarea
                  value={form.blurb}
                  onChange={(e) => upd("blurb", e.target.value)}
                  rows={3}
                  placeholder="Two or three sentences, shown under the product title and on the shop card."
                  className={`${input} resize-none`}
                />
              </div>
              <div>
                <label className={label}>Product description</label>
                <RichText
                  value={form.description}
                  onChange={(html) => upd("description", html)}
                  placeholder="The full description. Use headings and bullet lists to break it up."
                />
              </div>
              <div>
                <label className={label}>SEO meta description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => upd("metaDescription", e.target.value)}
                  rows={3}
                  placeholder="One or two sentences for the Google result."
                  className={`${input} resize-none`}
                />
                <CharCount value={form.metaDescription} ideal={155} />
              </div>
            </FormGroup>

            {/* ---- MODEL(S) ---- */}
            <FormGroup
              title="Model(s)"
              hint="What a customer actually buys. Every basket is re-priced from here at checkout, so these are the prices that count."
              action={
                <button
                  type="button"
                  onClick={() =>
                    upd("variants", [...form.variants, { ...emptyVariant }])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-green hover:underline"
                >
                  <Plus className="size-3.5" /> Add model
                </button>
              }
            >
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div
                    key={i}
                    className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center"
                  >
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
                      placeholder="Model code * — W2905-3CF"
                      className={input}
                    />
                    <input
                      value={v.optionLabel}
                      onChange={(e) =>
                        upd(
                          "variants",
                          form.variants.map((x, j) =>
                            j === i ? { ...x, optionLabel: e.target.value } : x
                          )
                        )
                      }
                      placeholder="Label — UF / RO"
                      className={input}
                    />
                    <div>
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
                      <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
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
                          className="size-3.5 accent-green"
                        />
                        Before VAT
                      </label>
                    </div>
                    <button
                      onClick={() =>
                        upd(
                          "variants",
                          form.variants.filter((_, j) => j !== i)
                        )
                      }
                      aria-label="Remove this model"
                      className="grid size-11 place-items-center self-start rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* ---- the content sections, in the sheet's order ---- */}
            <BulletEditor
              title="Key Features"
              hint="One per line. Shown as a ticked list beside the product."
              placeholder="Hot, Cold & Normal Purified Water"
              items={form.keyFeatures}
              onChange={(items) => upd("keyFeatures", items)}
            />

            <BulletEditor
              title={whyChooseHeading(form.name.trim() || "this product")}
              hint="The heading follows the product title automatically — rename the product and it updates."
              placeholder="Clean and safe drinking water every day"
              items={form.whyChoose}
              onChange={(items) => upd("whyChoose", items)}
            />

            <BulletEditor
              title="Perfect For"
              hint="Where this product suits — homes, offices, clinics."
              placeholder="Offices & Workplaces"
              items={form.perfectFor}
              onChange={(items) => upd("perfectFor", items)}
            />

            <SpecEditor
              rows={form.specs}
              onChange={(rows) => upd("specs", rows)}
            />

            <HighlightEditor
              rows={form.features}
              onChange={(rows) => upd("features", rows)}
            />

            <label className="flex cursor-pointer items-center gap-2.5 border-t border-slate-100 pt-5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => upd("isPublished", e.target.checked)}
                className="size-4 accent-green"
              />
              Show this product in the shop
            </label>
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

      {/* brands */}
      {managingBrands && (
        <Modal
          title="Brands"
          sub="Each product carries one brand. It shows on the product page and in its search-engine listing."
          onClose={() => setManagingBrands(false)}
        >
          {brands.length === 0 ? (
            <p className="text-sm text-slate-400">
              No brands yet. If this stays empty after adding one, run{" "}
              <strong>019_product_content_fields.sql</strong>.
            </p>
          ) : (
            <ul className="space-y-2">
              {brands.map((b) => {
                const used = (products ?? []).filter(
                  (p) => p.brand_id === b.id
                ).length;
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5"
                  >
                    <input
                      defaultValue={b.name}
                      onBlur={(e) => renameBrand(b, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      aria-label={`Rename ${b.name}`}
                      className="min-w-0 flex-1 rounded-lg border border-transparent px-2.5 py-1.5 text-sm outline-none transition hover:border-slate-200 focus:border-green"
                    />
                    <span className="shrink-0 text-xs text-slate-400">
                      {used}
                    </span>
                    <button
                      onClick={() => removeBrand(b)}
                      aria-label={`Delete ${b.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addBrand();
              }}
              placeholder="New brand"
              className={input}
            />
            <button
              onClick={addBrand}
              disabled={!newBrand.trim()}
              className="shrink-0 rounded-xl bg-ink px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              Add
            </button>
          </div>
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

/* A titled block of the form. The titles mirror the client's Product.xlsx
   so the person filling this in is looking at the same shape they wrote. */
function FormGroup({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {action}
      </div>
      {hint && <p className="mb-3 text-xs text-slate-400">{hint}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/* Length readout for the two SEO fields — green while it still fits. */
function CharCount({ value, ideal }: { value: string; ideal: number }) {
  const over = value.length > ideal;
  return (
    <p
      className={`mt-1 text-xs ${over ? "text-amber-600" : "text-slate-400"}`}
    >
      {value.length} characters
      {over ? ` — over ${ideal}, Google may cut it off` : ` of about ${ideal}`}
    </p>
  );
}

/* Mirrors lib/admin/slug.ts so the field can show what will be generated. */
function slugPreview(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---- Editors for the repeating sections of a product ------------
   Three shapes, from the client's Product.xlsx:
     · BulletEditor   — a plain list (Key Features, Why Choose, Perfect For)
     · SpecEditor     — the Technical Specifications table
     · HighlightEditor— a headline beside a rich-text explanation
   ------------------------------------------------------------------ */

/* A plain list of one-line bullets. Enter adds the next row, so a list can
   be typed straight through without reaching for the mouse. */
function BulletEditor({
  title,
  hint,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const set = (i: number, value: string) =>
    onChange(items.map((v, j) => (j === i ? value : v)));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green hover:underline"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">{hint}</p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-300">Nothing added yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((value, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-green/60" />
              <input
                value={value}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onChange([
                      ...items.slice(0, i + 1),
                      "",
                      ...items.slice(i + 1),
                    ]);
                  }
                }}
                placeholder={placeholder}
                className={input}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Remove "${value || "empty row"}"`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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

/* The Technical Specifications table. Laid out as an actual table with the
   brief's column headings, so the admin sees what the product page renders. */
function SpecEditor({
  rows,
  onChange,
}: {
  rows: { label: string; value: string }[];
  onChange: (rows: { label: string; value: string }[]) => void;
}) {
  const set = (i: number, key: "label" | "value", v: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Technical Specifications
        </h3>
        <button
          type="button"
          onClick={() => onChange([...rows, { label: "", value: "" }])}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green hover:underline"
        >
          <Plus className="size-3.5" /> Add row
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">
        One row per specification. Renders as a two-column table on the product
        page.
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-300">Nothing added yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1fr_1.6fr_44px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-2.5 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {SPEC_COLUMNS[0]}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {SPEC_COLUMNS[1]}
            </span>
            <span />
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1.6fr_44px] items-center gap-2 p-2"
              >
                <input
                  value={row.label}
                  onChange={(e) => set(i, "label", e.target.value)}
                  placeholder="Heating Power"
                  className="w-full rounded-lg border border-transparent px-2.5 py-2 text-sm outline-none transition hover:border-slate-200 focus:border-green"
                />
                <input
                  value={row.value}
                  onChange={(e) => set(i, "value", e.target.value)}
                  placeholder="420W"
                  className="w-full rounded-lg border border-transparent px-2.5 py-2 text-sm outline-none transition hover:border-slate-200 focus:border-green"
                />
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  aria-label={`Remove ${row.label || "row"}`}
                  className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* Highlights: a short headline beside a longer explanation. The brief notes
   these "require more space than a row", so the explanation is the rich-text
   editor rather than a single-line input. */
function HighlightEditor({
  rows,
  onChange,
}: {
  rows: { title: string; body: string }[];
  onChange: (rows: { title: string; body: string }[]) => void;
}) {
  const set = (i: number, key: "title" | "body", v: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">Highlights</h3>
        <button
          type="button"
          onClick={() => onChange([...rows, { title: "", body: "" }])}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green hover:underline"
        >
          <Plus className="size-3.5" /> Add highlight
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">
        A headline and its explanation — Installation, Delivery, Warranty &amp;
        After Sales.
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-300">Nothing added yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] sm:gap-3"
            >
              <div className="flex items-start gap-2">
                <input
                  value={row.title}
                  onChange={(e) => set(i, "title", e.target.value)}
                  placeholder="Warranty & After Sales"
                  className={`${input} font-medium`}
                />
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  aria-label={`Remove ${row.title || "highlight"}`}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 sm:order-last"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-2 sm:mt-0">
                <RichText
                  value={row.body}
                  onChange={(html) => set(i, "body", html)}
                  placeholder="Explanation — several lines is fine."
                  minHeight={120}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
