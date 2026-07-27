import type { Metadata } from "next";
import TodosView from "@/components/admin/TodosView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "To-dos" };

export default async function AdminTodosPage() {
  await requirePageAccess("todos");
  return <TodosView />;
}
