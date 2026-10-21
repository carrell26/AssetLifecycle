import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ModalPortal renders its children directly into document.body.
 * This guarantees that fixed modal overlays cover the entire viewport
 * from edge to edge (including topbar and sidebar) without any gaps,
 * clipping, or stacking context restrictions.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      setMounted(false);
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
