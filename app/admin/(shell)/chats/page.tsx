import type { Metadata } from "next";
import ChatsView from "@/components/admin/ChatsView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Live Chat" };

export default async function AdminChatsPage() {
  await requirePageAccess("chats");
  return <ChatsView />;
}
