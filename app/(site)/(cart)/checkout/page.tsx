import type { Metadata } from "next";
import CheckoutClient from "@/components/shop/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Place your Lusako water purifier order — an agent will call you as soon as possible to confirm delivery and installation.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
