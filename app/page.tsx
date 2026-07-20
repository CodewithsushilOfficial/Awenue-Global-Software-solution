import Navigation from "@/components/sections/Navigation";
import Hero from "@/components/sections/Hero";
import TrustBar from "@/components/sections/TrustBar";
import Services from "@/components/sections/Services";
import Products from "@/components/sections/Products";
import Portfolio from "@/components/sections/Portfolio";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="grow">
        <Hero />
        <TrustBar />
        <Services />
        <Products />
        <Portfolio />
        <ProcessTimeline />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
