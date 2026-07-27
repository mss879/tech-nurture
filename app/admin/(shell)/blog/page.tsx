import type { Metadata } from "next";
import BlogView from "@/components/admin/BlogView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requirePageAccess("blog");
  return <BlogView />;
}
