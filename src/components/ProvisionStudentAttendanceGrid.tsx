import { useCallback, useMemo, useState } from "react";
import { Button, Card } from "react-bootstrap";
import {
  DataGrid,
  GridToolbar,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { applyColumnFilters, withFilterHeaders } from "./GridColumnFilter";
import { ABSENT_REMARKS } from "../data/attendanceMockData";
import type { AttendanceStudentRecord } from "../types/attendance";

type ProvisionRow = {
  id: string;
  slNo: number;
  studentName: string;
  studentId: string;
  college: string;
  branch: string;
  present: "Y" | "N" | "";
  remark: string;
};

type ProvisionStudentAttendanceGridProps = {
  students: AttendanceStudentRecord[];
  course: string;
  batch: string;
  onChange: (students: AttendanceStudentRecord[]) => void;
};

function toPresentValue(status: AttendanceStudentRecord["attendanceStatus"]): "Y" | "N" | "" {
  if (status === "Present") return "Y";
  if (status === "Absent") return "N";
  return "";
}

function fromPresentValue(
  present: "Y" | "N" | "",
  remark: string
): Pick<AttendanceStudentRecord, "attendanceStatus" | "remark" | "autoAbsent25"> {
  if (present === "Y") {
    return { attendanceStatus: "Present", remark: "", autoAbsent25: false };
  }
  if (present === "N") {
    return {
      attendanceStatus: "Absent",
      remark: remark || ABSENT_REMARKS[0],
      autoAbsent25: remark === "AUTO ABSENT (25% WINDOW)",
    };
  }
  return { attendanceStatus: "Pending", remark: "", autoAbsent25: false };
}

function toRows(students: AttendanceStudentRecord[]): ProvisionRow[] {
  return students.map((student, index) => ({
    id: student.id,
    slNo: index + 1,
    studentName: student.name,
    studentId: student.id,
    college: student.college,
    branch: student.branch,
    present: toPresentValue(student.attendanceStatus),
    remark: student.remark,
  }));
}

export default function ProvisionStudentAttendanceGrid({
  students,
  course,
  batch,
  onChange,
}: ProvisionStudentAttendanceGridProps) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const rows = useMemo(() => toRows(students), [students]);
  const displayedRows = applyColumnFilters(rows, columnFilters);

  const overallPercent = useMemo(() => {
    if (students.length === 0) return 0;
    const present = students.filter((s) => s.attendanceStatus === "Present").length;
    return Math.round((present / students.length) * 100);
  }, [students]);

  const updateStudent = useCallback(
    (studentId: string, patch: Partial<ProvisionRow>) => {
      onChange(
        students.map((student) => {
          if (student.id !== studentId) return student;
          const present = patch.present ?? toPresentValue(student.attendanceStatus);
          const remark = patch.remark ?? student.remark;
          return { ...student, ...fromPresentValue(present, remark) };
        })
      );
    },
    [onChange, students]
  );

  const handleFilterChange = useCallback((field: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const columns = useMemo<GridColDef<ProvisionRow>[]>(() => {
    const base: GridColDef<ProvisionRow>[] = [
      { field: "slNo", headerName: "Sl No", width: 70 },
      { field: "studentName", headerName: "Student Name", flex: 1, minWidth: 150 },
      { field: "studentId", headerName: "Student Id", width: 120 },
      { field: "college", headerName: "College", flex: 1, minWidth: 140 },
      { field: "branch", headerName: "Branch", width: 100 },
      {
        field: "present",
        headerName: "Present",
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<ProvisionRow>) => (
          <FormControl size="small" fullWidth>
            <Select
              value={params.row.present}
              displayEmpty
              onChange={(event) =>
                updateStudent(params.row.id, {
                  present: event.target.value as "Y" | "N" | "",
                })
              }
              onClick={(event) => event.stopPropagation()}
              renderValue={(value) => {
                if (value === "Y") {
                  return <span className="status-present">Y</span>;
                }
                if (value === "N") {
                  return <span className="status-absent">N</span>;
                }
                return <span className="text-muted">-</span>;
              }}
            >
              <MenuItem value="">
                <em>Pending</em>
              </MenuItem>
              <MenuItem value="Y">Y</MenuItem>
              <MenuItem value="N">N</MenuItem>
            </Select>
          </FormControl>
        ),
      },
      {
        field: "remark",
        headerName: "Remark",
        flex: 1,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<ProvisionRow>) => {
          if (params.row.present !== "N") {
            return <span className="text-muted">-</span>;
          }
          return (
            <FormControl size="small" fullWidth>
              <Select
                value={params.row.remark}
                displayEmpty
                onChange={(event) =>
                  updateStudent(params.row.id, { remark: event.target.value })
                }
                onClick={(event) => event.stopPropagation()}
              >
                <MenuItem value="">
                  <em>Select remark</em>
                </MenuItem>
                {ABSENT_REMARKS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
    ];

    return withFilterHeaders(base, handleFilterChange, showFilters, ["present", "remark"]);
  }, [handleFilterChange, showFilters, updateStudent]);

  return (
    <>
      <div className="attendance-summary-bar d-flex flex-wrap gap-4 mb-3 rounded px-3 py-2">
        <span>Course: {course}</span>
        <span>Batch: {batch}</span>
        <span>Overall Attendance %: {overallPercent}%</span>
        <span>Total Students: {students.length}</span>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white fw-semibold d-flex justify-content-between align-items-center">
          <span>Studentwise Attendance</span>
          <Button
            variant="outline-primary"
            size="sm"
            className="btn-outline-brand"
            onClick={() => {
              setShowFilters((prev) => {
                if (prev) setColumnFilters({});
                return !prev;
              });
            }}
          >
            {showFilters ? "Hide Column Filters" : "Show Column Filters"}
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Box className="data-grid-container">
            <DataGrid
              rows={displayedRows}
              columns={columns}
              columnHeaderHeight={showFilters ? 80 : 56}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              disableColumnResize
              autosizeOnMount
              autosizeOptions={{
                includeHeaders: false,
                includeOutliers: true,
                expand: true,
              }}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
            />
          </Box>
        </Card.Body>
      </Card>
    </>
  );
}
