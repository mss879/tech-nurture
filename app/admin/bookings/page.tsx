import type { Metadata } from "next";
import BookingsView from "@/components/admin/BookingsView";

export const metadata: Metadata = { title: "Services Booking" };

export default function AdminBookingsPage() {
  return <BookingsView />;
}
