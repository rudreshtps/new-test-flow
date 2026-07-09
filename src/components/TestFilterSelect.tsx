import React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";

export type TestFilterSelectOption = {
  value: string;
  label: string;
};

const menuItemStyle = { fontSize: "14px", fontFamily: "inherit" };
const labelStyle = { fontSize: "14px", fontFamily: "inherit" };
const selectStyle = { height: "36px", fontSize: "14px", fontFamily: "inherit" };

type TestFilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TestFilterSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  minWidth?: number;
  fullWidth?: boolean;
  className?: string;
  labelId?: string;
};

const TestFilterSelect: React.FC<TestFilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  minWidth = 140,
  fullWidth = false,
  className,
  labelId,
}) => {
  const id =
    labelId || `test-filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl
      variant="outlined"
      size="small"
      className={className}
      style={{
        minWidth: fullWidth ? 0 : minWidth,
        width: fullWidth ? "100%" : undefined,
      }}
      fullWidth={fullWidth}
    >
      <InputLabel id={id} style={labelStyle}>
        {label}
      </InputLabel>
      <Select
        labelId={id}
        value={value}
        onChange={handleChange}
        label={label}
        disabled={disabled}
        style={selectStyle}
      >
        {placeholder && (
          <MenuItem value="" style={menuItemStyle}>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} style={menuItemStyle}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TestFilterSelect;
