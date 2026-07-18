import { getServerSupabase, notConfigured } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "blog";

// Raster formats only. Explicitly excludes image/svg+xml, which can carry
// scripts and would be a stored-XSS vector when served from the public bucket.
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

/* POST multipart/form-data with a `file` field → uploads the image to
   the public 'blog' Storage bucket via the service-role key and returns
   its public URL for use as a post cover image. */
export async function POST(request: Request) {
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

  const path = `covers/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("blog image upload failed:", error);
    return Response.json(
      {
        error:
          "Could not upload the image. Make sure the 'blog' storage bucket exists (007_blog.sql).",
      },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return Response.json({ url: publicUrl }, { status: 201 });
}
