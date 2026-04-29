import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import PixSection from "./components/PixSection";
import CtaStrip from "./components/CtaStrip";
import Footer from "./components/Footer";

// páginas novas
function Home() {
  return (
    <>
      <Hero />
      <Features />
      <PixSection />
      <CtaStrip />
    </>
  );
}

function Login() {
  return <h1 style={{ padding: 40 }}>Tela de Login</h1>;
}

function Cadastro() {
  return <h1 style={{ padding: 40 }}>Tela de Cadastro</h1>;
}

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>

      <Footer />
    </>
  );
}