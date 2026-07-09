import React from "react";
import { Dropdown, Form } from "react-bootstrap";

export interface OptionItem {
  value: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: OptionItem[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxMenuHeight?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  maxMenuHeight = 220,
}) => {
  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const handleToggle = (checked: boolean, optValue: string) => {
    const option = options.find((o) => o.value === optValue);
    if (!checked && option?.disabled) return;
    if (checked) {
      onChange(Array.from(new Set([...value, optValue])));
    } else {
      onChange(value.filter((v) => v !== optValue));
    }
  };

  const renderToggleText = () => {
    if (value.length === 0) return placeholder;
    if (value.length <= 2) return selectedLabels.join(", ");
    return `${value.length} selected`;
  };

  const sortedOptions = [...options].sort((a, b) => {
    const aSelected = value.includes(a.value);
    const bSelected = value.includes(b.value);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  return (
    <Dropdown className="w-100" autoClose="outside" style={{ position: "relative" }}>
      <Dropdown.Toggle
        variant="outline-secondary"
        className="w-100 d-flex justify-content-between align-items-center"
        disabled={disabled}
      >
        <span className="text-truncate" style={{ maxWidth: "85%" }}>
          {renderToggleText()}
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu
        className="w-100 p-2"
        style={{
          maxHeight: maxMenuHeight,
          overflowY: "auto",
          zIndex: 1050,
          position: "absolute",
        }}
      >
        {options.length === 0 && (
          <div className="text-muted px-2 py-1 small">No options</div>
        )}
        {sortedOptions.map((opt) => (
          <Dropdown.Item
            as="div"
            key={opt.value}
            className={`px-2 py-1 ${opt.className || ""}`}
            style={opt.style}
          >
            <Form.Check
              type="checkbox"
              id={`ms-${opt.value}`}
              label={opt.label}
              checked={value.includes(opt.value)}
              onChange={(e) => handleToggle(e.target.checked, opt.value)}
              disabled={opt.disabled}
            />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MultiSelect;
