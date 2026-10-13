import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ChatWidget from "./components/ChatWidget";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import ScrollProgress from "./components/ScrollProgress";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Project from "./pages/Project";
import { CHAT_ENABLED } from "./lib/site";

/** Scrolls to a #hash target, or to the top on a new page. */
function useScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section exists after a route change.
      const id = requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
      return () => cancelAnimationFrame(id);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
}

export default function App() {
  const { pathname } = useLocation();
  useScrollManager();

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <ScrollProgress />
      <Nav />
      <motion.main
        id="content"
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:id" element={<Project />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
      <Footer />
      {CHAT_ENABLED && <ChatWidget />}
    </>
  );
}
