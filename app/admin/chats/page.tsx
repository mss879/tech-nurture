import type { Metadata } from "next";
import ChatsView from "@/components/admin/ChatsView";

export const metadata: Metadata = { title: "Live Chat" };

export default function AdminChatsPage() {
  return <ChatsView />;
}
