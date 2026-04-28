import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import PixSection from "./components/PixSection";
import CtaStrip from "./components/CtaStrip";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <PixSection />
        <CtaStrip />
      </main>
      <Footer />
    </>
  );
}
