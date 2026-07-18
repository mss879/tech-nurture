import type { Metadata } from "next";
import BlogView from "@/components/admin/BlogView";

export const metadata: Metadata = { title: "Blog" };

export default function AdminBlogPage() {
  return <BlogView />;
}
