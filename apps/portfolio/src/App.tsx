import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ChatWidget from "./components/ChatWidget";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import ScrollProgress from "./components/ScrollProgress";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Project from "./pages/Project";
import { CHAT_ENABLED } from "./lib/site";
import { scrollToId } from "./lib/scroll";

/**
 * Scrolls to a #hash target, or to the top on a new page.
 * Depends on location.key, which changes on every navigation, so clicking a link whose address
 * is already the current one (for example "Work" while the URL says #work) still scrolls.
 * Respects the visitor's reduce-motion setting.
 */
function useScrollManager() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash) {
      scrollToId(hash.slice(1));
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash, key]);
}

/** The v1 address of a project page, kept so old links still work. */
function OldWorkLink() {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}`} replace />;
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
          <Route path="/projects/:id" element={<Project />} />
          <Route path="/work/:id" element={<OldWorkLink />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
      {pathname === "/" || pathname.startsWith("/projects/") ? <Contact /> : null}
      <Footer />
      {CHAT_ENABLED && <ChatWidget />}
    </>
  );
}
