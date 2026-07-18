import SmoothScroll from "@/components/providers/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/ui/Preloader";
import Tracker from "@/components/analytics/Tracker";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Preloader />
      <SmoothScroll>
        <Header />
        <main>{children}</main>
        <Footer />
      </SmoothScroll>
      <Tracker />
    </>
  );
}
