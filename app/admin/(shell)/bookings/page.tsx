import type { Metadata } from "next";
import BookingsView from "@/components/admin/BookingsView";
import { requirePageAccess } from "@/lib/admin/permissions";

export const metadata: Metadata = { title: "Services Booking" };

export default async function AdminBookingsPage() {
  await requirePageAccess("bookings");
  return <BookingsView />;
}
