import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./App";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/cadastro" element={<Layout><Cadastro /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
    </Routes>
  </BrowserRouter>
);