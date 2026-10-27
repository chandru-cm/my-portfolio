import { useEffect } from "react";

const BASE = "Chandra Moorthy | Full-stack developer";

/** Sets the tab title and, when given, the page description that search and link previews use. */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Chandra Moorthy` : BASE;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) return;
    const original = meta.dataset.original ?? meta.content;
    meta.dataset.original = original;
    meta.content = description ?? original;
    return () => {
      meta.content = original;
    };
  }, [title, description]);
}
