import React, { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { Alert, Button, Col, Modal, Row, Spinner } from "react-bootstrap";
import { BsClock } from "react-icons/bs";
import { VscListFlat } from "react-icons/vsc";
import { GiStarShuriken } from "react-icons/gi";
import { MdQuiz } from "react-icons/md";
import { TiGroupOutline } from "react-icons/ti";
import { HiOutlineLockClosed } from "react-icons/hi2";
import ConfirmationModal from "../components/ConfirmationModal";
import StudentReport from "../components/StudentReport";
import SecurityLogsPanel from "../components/SecurityLogsPanel";
import TestFilterSelect from "../components/TestFilterSelect";
import TestCardSchedule from "../components/TestCardSchedule";
import { REPORT_TEST_TYPES } from "../data/reportMockData";
import type { ReportData, ReportStudentRow, TestReportViewData } from "./types";
import {
  fetchAllTracksForCourses,
  fetchBatchesByCourse,
  fetchCoursesByTrack,
  fetchReportsList,
  fetchSubjectsForBatch,
  fetchTestReportDetail,
  releaseTestReports,
} from "./reportApi";
import {
  computeReportDetailStats,
  downloadTestReportCsv,
  filterReportDetailRows,
  sortReportDetailRows,
  getReportFinalScorePercent,
  formatObtainedValue,
  formatFinalScoreValue,
  isReportStudentAssigned,
  getReportStudentStatusStyle,
  resolveReportStudentDisplayStatus,
  type ReportStudentSortField,
  formatReportTimeRange,
  getReportCardDate,
  getVisibleReportSearchText,
  matchesVisibleCardSearch,
} from "../utils/testReportUtils";
import { useTestCardSearchQuery } from "../components/TestPageShell";
import { decodeTestNameFromPath, useTestRoutes } from "./testRoutes";

const metaIconStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "1.2em",
  lineHeight: 1,
  verticalAlign: "middle",
  flexShrink: 0,
};

const studentAvatarStyle: CSSProperties = {
  width: "1.75rem",
  height: "1.75rem",
  borderRadius: "999px",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "0.7rem",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "0.5rem",
  flexShrink: 0,
};

const getTestStatusBadgeStyle = (
  variant: "aborted" | "paused" | "live" | "scheduled" | "completed"
): CSSProperties => {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    lineHeight: 1,
  };

  if (variant === "aborted") {
    return { ...base, backgroundColor: "#fee2e2", color: "#991b1b" };
  }
  if (variant === "paused") {
    return { ...base, backgroundColor: "#fef3c7", color: "#92400e" };
  }
  if (variant === "scheduled") {
    return { ...base, backgroundColor: "#dbeafe", color: "#1d4ed8" };
  }
  if (variant === "live") {
    return { ...base, backgroundColor: "#dcfce7", color: "#166534" };
  }
  return { ...base, backgroundColor: "#f1f5f9", color: "#475569" };
};

const loadingOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "rgba(255, 255, 255, 0.8)",
  zIndex: 1000,
};

type ReportMetaFieldProps = {
  label: string;
  value: string;
};

type ReportStudentTableProps = {
  rows: ReportStudentRow[];
  showRank: boolean;
  containerStyle?: CSSProperties;
  onViewStudent?: (studentId: string, studentName: string) => void;
  manualReportRelease?: boolean;
  reportReleased?: boolean;
};

type ReportStudentColumn = {
  id: ReportStudentSortField | "slNo";
  label: string;
  sortable: boolean;
  align?: "left" | "center" | "right";
};

const headerCellSx = {
  fontWeight: 600,
  fontSize: "0.8rem",
  color: "text.secondary",
  bgcolor: "#f8fafc",
  borderBottom: "1px solid",
  borderColor: "divider",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const bodyCellSx = {
  fontSize: "0.875rem",
  borderBottom: "1px solid",
  borderColor: "divider",
};

const formatCellValue = (value: number | null | undefined) =>
  value !== null && value !== undefined ? value : "--";

const getStudentInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const stopRowClick = (event: React.MouseEvent) => {
  event.stopPropagation();
};

const ReportStudentTable: React.FC<ReportStudentTableProps> = ({
  rows,
  showRank,
  containerStyle,
  onViewStudent,
  manualReportRelease = false,
  reportReleased = false,
}) => {
  const [sortField, setSortField] = useState<ReportStudentSortField | null>("Obtained_marks");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const columns: ReportStudentColumn[] = [
    { id: "slNo", label: "Sl.No", sortable: false },
    { id: "ID", label: "ID", sortable: true },
    { id: "Student", label: "Student", sortable: true },
    { id: "College", label: "College", sortable: true },
    { id: "Branch", label: "Branch", sortable: true },
    { id: "Category", label: "Category", sortable: true },
    { id: "display_status", label: "Status", sortable: true, align: "center" },
    { id: "Max_marks", label: "Max Marks", sortable: true, align: "center" },
    { id: "Obtained_marks", label: "Obtained", sortable: true, align: "center" },
    { id: "final_percent", label: "Final Score", sortable: true, align: "center" },
    ...(showRank
      ? [{ id: "Rank" as const, label: "Rank", sortable: true, align: "center" as const }]
      : []),
  ];

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    return sortReportDetailRows(rows, sortField, sortDirection);
  }, [rows, sortField, sortDirection]);

  const handleSort = (field: ReportStudentSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  };

  const totalColumns = columns.length + 1;

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: "transparent",
          overflowY: "auto",
          ...containerStyle,
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align ?? "left"}
                  sx={headerCellSx}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.id}
                      direction={sortField === column.id ? sortDirection : "asc"}
                      onClick={() => handleSort(column.id as ReportStudentSortField)}
                      sx={{
                        "& .MuiTableSortLabel-icon": {
                          opacity: sortField === column.id ? 1 : 0.3,
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    <Box component="span">{column.label}</Box>
                  )}
                </TableCell>
              ))}
              <TableCell sx={headerCellSx} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No students match your search.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((student, index) => (
                  <TableRow
                    key={`${student.ID}-${index}`}
                    sx={{
                      bgcolor: index % 2 === 0 ? "background.paper" : "grey.50",
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={bodyCellSx}>{index + 1}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 500 }}>{student.ID}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 500 }}>
                      <span className="d-inline-flex align-items-center">
                        <span style={studentAvatarStyle}>
                          {getStudentInitials(student.Student)}
                        </span>
                        {student.Student}
                      </span>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>{student.College}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.Branch}</TableCell>
                    <TableCell sx={bodyCellSx}>{student.Category}</TableCell>
                    <TableCell sx={bodyCellSx} align="center">
                      {(() => {
                        const status = resolveReportStudentDisplayStatus(student);
                        const style = getReportStudentStatusStyle(status);
                        return (
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={{
                              backgroundColor: style.backgroundColor,
                              color: style.color,
                              fontSize: "0.72rem",
                              padding: "0.45rem 0.65rem",
                            }}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell sx={bodyCellSx} align="center">
                      {formatCellValue(student.Max_marks)}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        fontWeight: 600,
                        color: isReportStudentAssigned(student)
                          ? "text.secondary"
                          : student.Percentage != null && student.Percentage >= 40
                            ? "success.main"
                            : student.Percentage != null
                              ? "error.main"
                              : "text.secondary",
                      }}
                      align="center"
                    >
                      {formatObtainedValue(student)}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...bodyCellSx,
                        fontWeight: 600,
                        color: (() => {
                          if (isReportStudentAssigned(student)) {
                            return "text.secondary";
                          }
                          const finalPercent = getReportFinalScorePercent(student);
                          if (finalPercent == null) return "text.secondary";
                          return finalPercent >= 40 ? "success.main" : "error.main";
                        })(),
                      }}
                      align="center"
                    >
                      {formatFinalScoreValue(student)}
                    </TableCell>
                    {showRank && (
                      <TableCell sx={bodyCellSx} align="center">
                        {student.Rank || "--"}
                      </TableCell>
                    )}
                    <TableCell sx={bodyCellSx} align="center" onClick={stopRowClick}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.75,
                          justifyContent: "center",
                        }}
                      >
                        {manualReportRelease && !reportReleased && (
                          <span
                            title="Report locked for students until you release it"
                            style={{ display: "inline-flex" }}
                          >
                            <HiOutlineLockClosed
                              style={{
                                width: "22px",
                                height: "22px",
                                color: "#9e9e9e",
                              }}
                            />
                          </span>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-none"
                          onClick={() =>
                            onViewStudent?.(student.ID, student.Student)
                          }
                        >
                          View
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

const ReportMetaField: React.FC<ReportMetaFieldProps> = ({ label, value }) => (
  <div>
    <div className="small text-muted mb-1">{label}</div>
    <div
      className="border rounded bg-light px-2 py-2 small text-truncate"
      title={value}
    >
      {value || "—"}
    </div>
  </div>
);

/**
 * Report module: filter test reports, drill into results, export CSV.
 */
const TestReportContent: React.FC = () => {
  const { reportId: testNameParam } = useParams<{ reportId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routes = useTestRoutes();
  const routeTestName = decodeTestNameFromPath(testNameParam);
  const testId = searchParams.get("test_id") ?? undefined;
  const isDetailRoute = !!(routeTestName && testId);

  const cardSearchQuery = useTestCardSearchQuery();
  const [reportTracks, setReportTracks] = useState<
    Awaited<ReturnType<typeof fetchAllTracksForCourses>>
  >([]);
  const [reportTracksLoading, setReportTracksLoading] = useState(false);
  const [reportCourses, setReportCourses] = useState<
    Awaited<ReturnType<typeof fetchCoursesByTrack>>
  >([]);
  const [reportCoursesLoading, setReportCoursesLoading] = useState(false);
  const [reportBatches, setReportBatches] = useState<
    Awaited<ReturnType<typeof fetchBatchesByCourse>>
  >([]);
  const [reportBatchesLoading, setReportBatchesLoading] = useState(false);
  const [reportSubjectsList, setReportSubjectsList] = useState<string[]>([]);
  const [reportSubjectsLoading, setReportSubjectsLoading] = useState(false);
  const [reportTrackId, setReportTrackId] = useState("");
  const [reportCourseId, setReportCourseId] = useState("");
  const [reportBatchId, setReportBatchId] = useState("");
  const [reportSubjectFilter, setReportSubjectFilter] = useState("");
  const [reportTestType, setReportTestType] = useState("");
  const [selectedLiveOrCompleted, setSelectedLiveOrCompleted] = useState("");

  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [testReportView, setTestReportView] =
    useState<TestReportViewData | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [reportReleaseLoading, setReportReleaseLoading] = useState(false);
  const [examControlAlert, setExamControlAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleViewStudent = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setShowStudentModal(true);
  };

  const reloadTestReport = useCallback(async (live = false) => {
    if (!testId) return;
    const data = await fetchTestReportDetail(testId, { live });
    setTestReportView(data);
  }, [testId]);

  const handleReleaseReport = async () => {
    if (!testId) return;
    try {
      setReportReleaseLoading(true);
      setExamControlAlert(null);
      await releaseTestReports(testId, []);
      await reloadTestReport();
      setExamControlAlert({
        variant: "success",
        message: "Test report released. Students can now view their reports.",
      });
    } catch (error) {
      console.error("Report release failed:", error);
      setExamControlAlert({
        variant: "danger",
        message: "Failed to release test report. Please try again.",
      });
    } finally {
      setReportReleaseLoading(false);
      setShowReleaseConfirm(false);
    }
  };

  const displayTestStatus = testReportView?.test_status ?? "";
  const isTestOver = displayTestStatus.trim().toLowerCase() === "completed";
  const isLiveTestWindow = (() => {
    const normalized = displayTestStatus.trim().toLowerCase();
    return (
      normalized === "live" ||
      normalized === "scheduled" ||
      normalized === "paused" ||
      normalized === "upcoming"
    );
  })();

  const testStatusBadgeVariant: "aborted" | "paused" | "live" | "scheduled" | "completed" =
    (() => {
      const normalized = displayTestStatus.trim().toLowerCase();
      if (normalized === "aborted") return "aborted";
      if (normalized === "paused") return "paused";
      if (normalized === "live") return "live";
      if (normalized === "scheduled" || normalized === "upcoming") return "scheduled";
      return "completed";
    })();

  const manualReportRelease = testReportView
    ? !testReportView.auto_release_test_report
    : false;
  const reportReleased = testReportView?.report_released ?? false;

  useEffect(() => {
    if (routeTestName && !testId) {
      navigate(routes.reports, { replace: true });
    }
  }, [routeTestName, testId, navigate, routes.reports]);

  useEffect(() => {
    if (!isDetailRoute || !testId) {
      setTestReportView(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        const data = await fetchTestReportDetail(testId, { live: true });
        if (!cancelled) setTestReportView(data);
      } catch (error) {
        console.error("Error fetching test report:", error);
        if (!cancelled) navigate(routes.reports, { replace: true });
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDetailRoute, testId, navigate, routes.reports]);

  useEffect(() => {
    if (!isDetailRoute || !testId || !isLiveTestWindow) return undefined;

    const timer = window.setInterval(() => {
      void fetchTestReportDetail(testId, { live: true })
        .then(setTestReportView)
        .catch((error) => console.error("Live report refresh failed:", error));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isDetailRoute, testId, isLiveTestWindow]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReportTracksLoading(true);
      try {
        const tracks = await fetchAllTracksForCourses();
        if (!cancelled) setReportTracks(tracks);
      } catch (err) {
        console.error("Failed to fetch tracks for report:", err);
        if (!cancelled) setReportTracks([]);
      } finally {
        if (!cancelled) setReportTracksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!reportTrackId) {
      setReportCourses([]);
      setReportCourseId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setReportCoursesLoading(true);
      try {
        const courses = await fetchCoursesByTrack(reportTrackId);
        if (!cancelled) {
          setReportCourses(courses);
          setReportCourseId("");
          setReportBatchId("");
          setReportSubjectFilter("");
          setReportBatches([]);
          setReportSubjectsList([]);
        }
      } catch (err) {
        console.error("Failed to fetch courses for report:", err);
        if (!cancelled) {
          setReportCourses([]);
          setReportCourseId("");
        }
      } finally {
        if (!cancelled) setReportCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportTrackId]);

  useEffect(() => {
    if (!reportCourseId) {
      setReportBatches([]);
      setReportBatchId("");
      setReportSubjectFilter("");
      setReportSubjectsList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setReportBatchesLoading(true);
      try {
        const batches = await fetchBatchesByCourse(reportCourseId);
        if (!cancelled) {
          setReportBatches(batches);
          setReportBatchId("");
          setReportSubjectFilter("");
          setReportSubjectsList([]);
        }
      } catch (err) {
        console.error("Failed to fetch batches for report:", err);
        if (!cancelled) {
          setReportBatches([]);
          setReportBatchId("");
        }
      } finally {
        if (!cancelled) setReportBatchesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportCourseId]);

  useEffect(() => {
    if (!reportCourseId || !reportBatchId) {
      setReportSubjectsList([]);
      setReportSubjectFilter("");
      return;
    }
    let cancelled = false;
    (async () => {
      setReportSubjectsLoading(true);
      try {
        const subjects = await fetchSubjectsForBatch(
          reportCourseId,
          reportBatchId
        );
        if (!cancelled) {
          setReportSubjectsList(subjects);
          setReportSubjectFilter("");
        }
      } catch (err) {
        console.error("Failed to fetch subjects for report:", err);
        if (!cancelled) {
          setReportSubjectsList([]);
          setReportSubjectFilter("");
        }
      } finally {
        if (!cancelled) setReportSubjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportCourseId, reportBatchId]);

  useEffect(() => {
    const load = async () => {
      if (!reportTrackId || !reportCourseId) {
        setReports([]);
        return;
      }
      setReportLoading(true);
      try {
        const list = await fetchReportsList({
          track: reportTrackId,
          subject: reportSubjectFilter,
          course: reportCourseId,
          batch: reportBatchId,
          liveOrCompleted: selectedLiveOrCompleted,
          testType: reportTestType,
        });
        setReports(list);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReports([]);
      } finally {
        setReportLoading(false);
      }
    };
    load();
  }, [
    reportTrackId,
    reportCourseId,
    reportBatchId,
    reportSubjectFilter,
    reportTestType,
    selectedLiveOrCompleted,
  ]);

  const filteredReports = reports
    .filter(
      (report) =>
        !selectedLiveOrCompleted || report.status === selectedLiveOrCompleted
    )
    .filter((report) =>
      matchesVisibleCardSearch(
        getVisibleReportSearchText(report),
        cardSearchQuery
      )
    );

  const filteredReport = filterReportDetailRows(
    testReportView?.report,
    isDetailRoute ? cardSearchQuery : ""
  );

  const reportStats = useMemo(
    () =>
      computeReportDetailStats(
        testReportView?.report,
        testReportView?.test_end_time,
        isTestOver
      ),
    [testReportView?.report, testReportView?.test_end_time, isTestOver]
  );
  const handleTestReportView = (report: ReportData) => {
    navigate(routes.reportDetail(report.title, report.test_id));
  };

  return (
    <div className="position-relative">
      {detailLoading && (
        <div style={loadingOverlayStyle}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {!isDetailRoute && (
        <div className="d-flex rounded-1 justify-content-start py-2 gap-2">
          <div
            className="col-3 filterSection flex-shrink-0"
            style={{
              height: "calc(100vh - 150px)",
              overflowY: "auto",
              minWidth: "200px",
            }}
          >
            <div
              className="border m-0 border-light p-3 px-4"
              style={{ boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}
            >
              <div className="d-flex flex-column gap-3">
                <TestFilterSelect
                  label="Track"
                  value={reportTrackId}
                  onChange={setReportTrackId}
                  disabled={reportTracksLoading}
                  placeholder="Select Track"
                  options={reportTracks.map((t) => ({
                    value: t.track_id,
                    label: t.track_name,
                  }))}
                  fullWidth
                />
                <TestFilterSelect
                  label="Course"
                  value={reportCourseId}
                  onChange={setReportCourseId}
                  disabled={!reportTrackId || reportCoursesLoading}
                  placeholder="Select Course"
                  options={reportCourses.map((c) => ({
                    value: c.course_id,
                    label: c.course_name,
                  }))}
                  fullWidth
                />
                <TestFilterSelect
                  label="Batch"
                  value={reportBatchId}
                  onChange={setReportBatchId}
                  disabled={
                    !reportCourseId ||
                    reportBatchesLoading ||
                    reportBatches.length === 0
                  }
                  placeholder="Select Batch"
                  options={reportBatches.map((b) => ({
                    value: b.batch_id,
                    label: b.batch_name,
                  }))}
                  fullWidth
                />
                <TestFilterSelect
                  label="Subject"
                  value={reportSubjectFilter}
                  onChange={setReportSubjectFilter}
                  disabled={
                    !reportBatchId ||
                    reportSubjectsLoading ||
                    reportSubjectsList.length === 0
                  }
                  placeholder="Select Subject"
                  options={reportSubjectsList.map((subject) => ({
                    value: subject,
                    label: subject,
                  }))}
                  fullWidth
                />
                <TestFilterSelect
                  label="Test Type"
                  value={reportTestType}
                  onChange={setReportTestType}
                  placeholder="Select Test Type"
                  options={REPORT_TEST_TYPES.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  fullWidth
                />
                <TestFilterSelect
                  label="Status"
                  value={selectedLiveOrCompleted}
                  onChange={setSelectedLiveOrCompleted}
                  placeholder="Live or Completed"
                  options={[
                    { value: "Live", label: "Live" },
                    { value: "Completed", label: "Completed" },
                  ]}
                  fullWidth
                />
              </div>
            </div>
          </div>
          <div
            className="col filteredDataDisplaySection flex-grow-1 p-2"
            style={{
              height: "calc(100vh - 150px)",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {!(reportTrackId && reportCourseId) ? (
              <div
                className="d-flex justify-content-center align-items-center text-secondary"
                style={{ height: "100%" }}
              >
                <p className="text-center px-3 mb-0">
                  Please select a track and course to load test reports.
                  Optionally narrow by batch and subject.
                </p>
              </div>
            ) : reportLoading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => {
                const cardDate = getReportCardDate(report);
                const timeRange = formatReportTimeRange(report);
                return (
                  <div
                    key={report.test_id}
                    className="mb-2 ms-2 p-2 bg-white rounded border border-light shadow-sm"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTestReportView(report)}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-2 pb-1 border-bottom">
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold mb-0 lh-sm d-flex align-items-center flex-wrap gap-2">
                          <span>{report.title || "Test Title"}</span>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-1 text-secondary">
                          <span className="d-inline-flex align-items-center">
                            <VscListFlat className="me-1" />
                            {report.subject || "N/A"}
                          </span>
                          <span className="d-inline-flex align-items-center">
                            <BsClock className="me-1" style={metaIconStyle} />
                            {parseInt(report.duration)}{" "}
                            {parseInt(report.duration) === 1
                              ? "Minute"
                              : "Minutes"}
                          </span>
                          <span className="d-inline-flex align-items-center">
                            <GiStarShuriken className="me-1" />
                            {report.marks} Marks
                          </span>
                          {report.test_type && (
                            <span className="d-inline-flex align-items-center">
                              <MdQuiz className="me-1" />
                              {report.test_type}
                            </span>
                          )}
                          <span className="d-inline-flex align-items-center">
                            <TiGroupOutline className="me-1" size={18} />
                            {report.invited} invited
                          </span>
                        </div>
                      </div>
                      {(cardDate || timeRange) && (
                        <TestCardSchedule
                          dateLabel={cardDate}
                          timeLabel={timeRange}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      {report.batch && (
                        <div className="fs-6 mb-1">
                          <span className="fw-semibold">Batch:</span>{" "}
                          {report.batch}
                        </div>
                      )}
                      <div>
                        <span className="fw-semibold">Description</span>
                        <div className="text-dark lh-sm mt-1 text-break">
                          {report.description || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : reports.length > 0 && cardSearchQuery ? (
              <p className="text-muted ms-3 py-3 text-center">
                No tests match your search.
              </p>
            ) : (
              <p className="text-muted ms-3 py-3 text-center">
                No test reports found for the selected filters.
              </p>
            )}
          </div>
        </div>
      )}

      {isDetailRoute && testReportView && (
        <div className="rounded p-2" style={{ backgroundColor: "#f3f4f6" }}>
          <div className="d-flex justify-content-end align-items-center mb-2 gap-2 flex-wrap">
            {manualReportRelease && (
              reportReleased ? (
                <span
                  className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  Report Released to Students
                </span>
              ) : (
                <Button
                  variant="primary"
                  className="btn btn-sm"
                  size="sm"
                  disabled={reportReleaseLoading}
                  onClick={() => setShowReleaseConfirm(true)}
                >
                  {reportReleaseLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Releasing...
                    </>
                  ) : (
                    "Release Report to Students"
                  )}
                </Button>
              )
            )}
            <Button
              variant="outline-primary"
              className="btn btn-sm"
              size="sm"
              onClick={() =>
                downloadTestReportCsv(filteredReport, testReportView)
              }
            >
              Download Report
            </Button>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 bg-white h-100">
                <div className="card-body d-flex flex-column gap-3">
                  <Row className="g-3">
                    <Col xs={12} md={4}>
                      <ReportMetaField
                        label="Course"
                        value={testReportView.course_name}
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <ReportMetaField
                        label="Batch"
                        value={testReportView.batch_name}
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <ReportMetaField
                        label="Test Name"
                        value={testReportView.test_name}
                      />
                    </Col>
                  </Row>

                  <Row className="g-3 align-items-end">
                    <Col xs={12} md={4}>
                      <div>
                        <div className="small text-muted mb-1">Test Status</div>
                        <span style={getTestStatusBadgeStyle(testStatusBadgeVariant)}>
                          {displayTestStatus || "—"}
                        </span>
                      </div>
                    </Col>
                    <Col xs={12} md={5}>
                      <ReportMetaField
                        label="Date - Time"
                        value={`${testReportView.test_start_time} - ${testReportView.test_end_time}`}
                      />
                    </Col>
                    <Col xs={12} md={3}>
                      <ReportMetaField
                        label="Duration"
                        value={testReportView.duration}
                      />
                    </Col>
                  </Row>

                  <div className="border-top pt-3 mt-auto">
                    <div className="row text-center g-3">
                      <div className="col">
                        <div className="text-muted small text-uppercase">Total Students</div>
                        <div className="fs-4 fw-bold text-primary">
                          {reportStats.totalStudents}
                        </div>
                      </div>
                      <div className="col">
                        <div className="text-muted small text-uppercase">Appeared</div>
                        <div className="fs-4 fw-bold" style={{ color: "#6f42c1" }}>
                          {reportStats.appeared}
                        </div>
                      </div>
                      <div className="col">
                        <div className="text-muted small text-uppercase">Cleared</div>
                        <div className="fs-4 fw-bold text-success">{reportStats.cleared}</div>
                      </div>
                      <div className="col">
                        <div className="text-muted small text-uppercase">Failed</div>
                        <div className="fs-4 fw-bold text-danger">{reportStats.failed}</div>
                      </div>
                      <div className="col">
                        <div className="text-muted small text-uppercase">Avg Score</div>
                        <div className="fs-4 fw-bold text-dark">
                          {reportStats.avgScore.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {testId && (
                <SecurityLogsPanel
                  testId={testId}
                  testStatus={displayTestStatus}
                  onViolationsUpdated={() => reloadTestReport(true)}
                />
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 bg-white">
            <ReportStudentTable
              rows={filteredReport}
              showRank={testReportView.test_type === "Final Test"}
              onViewStudent={handleViewStudent}
              manualReportRelease={manualReportRelease}
              reportReleased={reportReleased}
              containerStyle={{
                minHeight: "250px",
                height: "calc(100vh - 500px)",
              }}
            />
          </div>
        </div>
      )}

      {examControlAlert && (
        <Alert
          variant={examControlAlert.variant}
          dismissible
          onClose={() => setExamControlAlert(null)}
          className="mb-3"
        >
          {examControlAlert.message}
        </Alert>
      )}

      <ConfirmationModal
        show={showReleaseConfirm}
        onHide={() => setShowReleaseConfirm(false)}
        onConfirm={handleReleaseReport}
        title="Release Test Report"
        message="Students will be able to view their test reports after you release them. This applies to all students assigned to this test. Continue?"
        confirmText="Release Report"
        cancelText="Cancel"
        variant="primary"
        isLoading={reportReleaseLoading}
      />

      <Modal
        show={showStudentModal}
        onHide={() => setShowStudentModal(false)}
        size="xl"
        centered
        scrollable
        className="test-flow-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedStudentName}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "85vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
          {selectedStudentId && testId && (
            <StudentReport
              studentId={selectedStudentId}
              testId={testId}
              testType={testReportView?.test_type ?? ""}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TestReportContent;
