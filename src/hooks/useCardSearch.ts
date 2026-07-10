import { useEffect, useRef, useState } from "react";

/**
 * Hook for the expandable card search in Test.tsx header.
 * Used by Assign and Report list views (not report detail).
 */
export function useCardSearch() {
  const [cardSearchOpen, setCardSearchOpen] = useState(false);
  const [cardSearchInput, setCardSearchInput] = useState("");
  /** Trimmed query applied when filtering test/report cards */
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const cardSearchInputRef = useRef<HTMLInputElement>(null!);

  // Focus input when search panel opens
  useEffect(() => {
    if (cardSearchOpen) {
      cardSearchInputRef.current?.focus();
    }
  }, [cardSearchOpen]);

  /** Sync input value and active filter query */
  const handleCardSearchInputChange = (value: string) => {
    setCardSearchInput(value);
    setCardSearchQuery(value.trim());
  };

  return {
    cardSearchOpen,
    setCardSearchOpen,
    cardSearchInput,
    cardSearchQuery,
    cardSearchInputRef,
    handleCardSearchInputChange,
  };
}
