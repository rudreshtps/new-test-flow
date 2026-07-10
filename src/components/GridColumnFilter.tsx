import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import type { GridColDef, GridValidRowModel } from "@mui/x-data-grid";

interface FilterHeaderProps {
  title: string;
  field: string;
  onFilterChange: (field: string, value: string) => void;
}

function FilterHeader({ title, field, onFilterChange }: FilterHeaderProps) {
  const [value, setValue] = useState("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 0.25, py: 0.5 }}>
      <span style={{ fontWeight: 700, color: "#000000", lineHeight: 1.2 }}>{title}</span>
      <TextField
        variant="standard"
        size="small"
        placeholder="Filter"
        value={value}
        fullWidth
        onChange={(e) => {
          setValue(e.target.value);
          onFilterChange(field, e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </Box>
  );
}

export function withFilterHeaders<T extends GridValidRowModel>(
  columns: GridColDef<T>[],
  onFilterChange: (field: string, value: string) => void,
  showFilters: boolean,
  exclude: string[] = []
): GridColDef<T>[] {
  if (!showFilters) return columns;
  return columns.map((col) =>
    exclude.includes(col.field)
      ? col
      : {
          ...col,
          renderHeader: () => (
            <FilterHeader
              title={col.headerName ?? col.field}
              field={col.field}
              onFilterChange={onFilterChange}
            />
          ),
        }
  );
}

export function applyColumnFilters<T extends GridValidRowModel>(
  rows: T[],
  filters: Record<string, string>
): T[] {
  const active = Object.entries(filters).filter(([, value]) => value.trim() !== "");
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every(([field, value]) =>
      String((row as Record<string, unknown>)[field] ?? "")
        .toLowerCase()
        .includes(value.toLowerCase())
    )
  );
}
