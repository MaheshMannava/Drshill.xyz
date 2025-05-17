"use client";

import { useState, useCallback, useEffect } from "react";

export const useHowToShillDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Show the dialog on first visit
  useEffect(() => {
    // Check if this dialog has been shown before
    const hasShownDialog = localStorage.getItem("hasShownHowToShillDialog");
    if (!hasShownDialog) {
      setIsOpen(true);
      localStorage.setItem("hasShownHowToShillDialog", "true");
    }
  }, []);

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openDialog,
    closeDialog,
    setIsOpen,
  };
}; 