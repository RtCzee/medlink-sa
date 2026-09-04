import SiteNavbar from "@/components/layout/site-navbar";
import SiteFooter from "@/components/layout/site-footer";
import HeroSection from "@/components/landing/hero-section";
import HomeClient from "@/components/landing/home-client";

export default function Page() {
  return (
    <>
      <SiteNavbar />
      <main className="relative">
        <HeroSection />
        <HomeClient />
        <SiteFooter />
      </main>
    </>
  );
}
