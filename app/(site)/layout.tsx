import SmoothScroll from "@/components/providers/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PreloaderGate from "@/components/ui/PreloaderGate";
import Tracker from "@/components/analytics/Tracker";
import ChatWidget from "@/components/ai/ChatWidget";
import { ProductNavProvider } from "@/components/layout/ProductNav";
import { getProducts } from "@/lib/products.server";

// The header's Products drop-down is CMS-driven; refresh it at most once
// a minute, in step with the other Supabase-backed pages.
export const revalidate = 60;

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const products = await getProducts();
  const productNav = products.map((p) => ({
    label: p.name,
    href: `/products/${p.slug}`,
  }));

  return (
    <ProductNavProvider items={productNav}>
      <PreloaderGate />
      <SmoothScroll>
        <Header />
        <main>{children}</main>
        <Footer />
      </SmoothScroll>
      <Tracker />
      <ChatWidget />
    </ProductNavProvider>
  );
}
