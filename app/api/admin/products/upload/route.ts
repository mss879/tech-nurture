import { getServerSupabase, notConfigured } from "@/lib/supabase/server";
import { requireNav, requireCapability } from "@/lib/admin/permissions";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "products";

// Raster formats only. Explicitly excludes image/svg+xml, which can carry
// scripts and would be a stored-XSS vector when served from the public bucket.
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

/* POST multipart/form-data with a `file` field → uploads the image to the
   public 'products' Storage bucket via the service-role key and returns
   its public URL for use in a product's gallery. */
export async function POST(request: Request) {
  const gate = await requireNav("products");
  if ("error" in gate) return gate.error;

  // Uploading an image is part of writing a product, so it needs the same
  // permission rather than being an open door for anyone who can look.
  const denied = requireCapability(gate.admin, "can_edit_products");
  if (denied) return denied.error;

  const supabase = getServerSupabase();
  if (!supabase) return notConfigured();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return Response.json(
      { error: "Only PNG, JPEG, WebP, GIF or AVIF images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Image is too large (max 5 MB)." },
      { status: 400 }
    );
  }

  const path = `items/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("product image upload failed:", error);
    return Response.json(
      {
        error:
          "Could not upload the image. Make sure the 'products' storage bucket exists (017_products.sql).",
      },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({ url: publicUrl }, { status: 201 });
}
