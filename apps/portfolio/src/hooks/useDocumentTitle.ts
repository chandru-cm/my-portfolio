import { useEffect } from "react";

const BASE = "Chandra Moorthy | Full-stack engineer";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Chandra Moorthy` : BASE;
  }, [title]);
}
