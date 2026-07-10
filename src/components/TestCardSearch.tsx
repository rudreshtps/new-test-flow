import React from "react";
import { Form } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

/** Props wired from Test.tsx via useCardSearch */
type TestCardSearchProps = {
  cardSearchOpen: boolean;
  setCardSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cardSearchInput: string;
  cardSearchInputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Expandable search field in the Test page header.
 * Filters visible text on Assign and Report card lists.
 */
const TestCardSearch: React.FC<TestCardSearchProps> = ({
  cardSearchOpen,
  setCardSearchOpen,
  cardSearchInput,
  cardSearchInputRef,
  onInputChange,
  placeholder = "Search tests...",
  ariaLabel = "Search tests",
}) => (
  <div className="d-flex align-items-center gap-2">
    {cardSearchOpen && (
      <Form.Control
        ref={cardSearchInputRef}
        type="search"
        size="sm"
        placeholder={placeholder}
        value={cardSearchInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setCardSearchOpen(false);
            onInputChange("");
          }
        }}
        style={{ width: 240 }}
        aria-label={ariaLabel}
      />
    )}
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
      aria-label={ariaLabel}
      title="Search"
      onClick={() => setCardSearchOpen((open) => !open)}
      style={{ width: 34, height: 34 }}
    >
      <FaSearch size={16} />
    </button>
  </div>
);

export default TestCardSearch;
