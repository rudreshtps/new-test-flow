import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Alert, Button, Spinner } from "react-bootstrap";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import type { LiveProctoringEventItem, LiveProctoringStudentItem } from "../test/types";
import { useLiveProctoringFeed } from "../test/useLiveProctoringFeed";
import {
  getReportStudentStatusStyle,
  resolveLiveProctoringSessionStatus,
} from "../utils/testReportUtils";
import { REPORT_STUDENT_STATUS } from "../constants/testConstants";

const headerCellSx = {
  fontWeight: 600,
  fontSize: "0.75rem",
  color: "text.secondary",
  bgcolor: "#f8fafc",
  whiteSpace: "nowrap",
};

const formatEventTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  });
};

const formatEventLabel = (event: string) =>
  event.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const studentAvatarStyle: React.CSSProperties = {
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

const getStudentInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

type ProctoringLiveMonitorProps = {
  testId: string;
  pollIntervalMs?: number;
  embedded?: boolean;
  onRefresh?: () => void;
  onViolationsUpdated?: () => void;
};

const StudentViolationRow: React.FC<{
  slNo: number;
  student: LiveProctoringStudentItem;
  events: LiveProctoringEventItem[];
  expanded: boolean;
  onToggle: () => void;
}> = ({ slNo, student, events, expanded, onToggle }) => {
  const displayName =
    student.student_name && student.student_name !== student.student_id
      ? student.student_name
      : student.student_id;
  const latestEventAt = student.latest_event_at ?? events[0]?.event_at;
  const latestEventType =
    student.latest_event_type ?? events[0]?.event ?? "";
  const sessionStatus = resolveLiveProctoringSessionStatus(student.session_status);
  const statusStyle = getReportStudentStatusStyle(sessionStatus);
  const isTerminated = sessionStatus === REPORT_STUDENT_STATUS.TERMINATED;

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: events.length > 0 ? "pointer" : "default",
          bgcolor: isTerminated ? "rgba(220, 38, 38, 0.06)" : undefined,
        }}
        onClick={events.length > 0 ? onToggle : undefined}
      >
        <TableCell align="center" sx={{ fontSize: "0.8rem", width: 48 }}>
          {slNo}
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", width: 40 }}>
          {events.length > 0 && (
            <IconButton size="small" aria-label={expanded ? "Collapse" : "Expand"}>
              {expanded ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem" }}>
          <span className="d-inline-flex align-items-center">
            <span style={studentAvatarStyle}>{getStudentInitials(displayName)}</span>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {student.student_id}
              </Typography>
            </Box>
          </span>
        </TableCell>
        <TableCell align="center" sx={{ fontSize: "0.8rem" }}>
          {student.score_retention_percent}%
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem" }}>
          <Chip
            label={sessionStatus}
            size="small"
            sx={{
              backgroundColor: statusStyle.backgroundColor,
              color: statusStyle.color,
              fontWeight: 600,
              fontSize: "0.72rem",
            }}
          />
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
          {latestEventAt ? formatEventTime(latestEventAt) : "--"}
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem" }}>
          {latestEventType ? formatEventLabel(latestEventType) : "--"}
        </TableCell>
      </TableRow>
      {events.length > 0 && (
        <TableRow>
          <TableCell colSpan={7} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ py: 1.5, px: 2, bgcolor: "#f8fafc" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Violation history
                </Typography>
                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...headerCellSx, py: 0.75 }} align="center">
                        Sl.No
                      </TableCell>
                      <TableCell sx={{ ...headerCellSx, py: 0.75 }}>Time</TableCell>
                      <TableCell sx={{ ...headerCellSx, py: 0.75 }}>Violation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell align="center" sx={{ fontSize: "0.78rem", py: 0.75 }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", py: 0.75 }}>
                          {formatEventTime(row.event_at)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", py: 0.75 }}>
                          {formatEventLabel(row.event)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ProctoringLiveMonitor: React.FC<ProctoringLiveMonitorProps> = ({
  testId,
  pollIntervalMs = 3000,
  embedded = false,
  onRefresh,
  onViolationsUpdated,
}) => {
  const [paused, setPaused] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const { events, students, stats, loading, error, lastFetchedAt, isLiveFeedActive, refresh } =
    useLiveProctoringFeed({
      testId,
      pollIntervalMs,
      paused,
      onNewViolations: onViolationsUpdated,
    });

  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  const eventsByStudent = useMemo(() => {
    const grouped: Record<string, LiveProctoringEventItem[]> = {};
    events.forEach((row) => {
      const key = row.student_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    Object.values(grouped).forEach((rows) => {
      rows.sort((a, b) => String(b.event_at ?? "").localeCompare(String(a.event_at ?? "")));
    });
    return grouped;
  }, [events]);

  const sortedStudents = useMemo(() => {
    const statusRank = (row: LiveProctoringStudentItem) => {
      const status = resolveLiveProctoringSessionStatus(row.session_status);
      switch (status) {
        case REPORT_STUDENT_STATUS.IN_PROGRESS:
          return 0;
        case REPORT_STUDENT_STATUS.TERMINATED:
          return 1;
        case REPORT_STUDENT_STATUS.COMPLETED:
          return 2;
        case REPORT_STUDENT_STATUS.ABORTED:
          return 3;
        case REPORT_STUDENT_STATUS.ABSENT:
          return 4;
        default:
          return 5;
      }
    };

    return [...students].sort((a, b) => {
      const rankDiff = statusRank(a) - statusRank(b);
      if (rankDiff !== 0) return rankDiff;
      const strikeDiff = (b.violation_count ?? 0) - (a.violation_count ?? 0);
      if (strikeDiff !== 0) return strikeDiff;
      return String(a.student_id).localeCompare(String(b.student_id));
    });
  }, [students]);

  const isLiveOngoing = isLiveFeedActive !== false;
  const totalStudents = students.length;
  const appearedStudents = students.filter(
    (row) =>
      resolveLiveProctoringSessionStatus(row.session_status) !==
      REPORT_STUDENT_STATUS.ASSIGNED
  ).length;
  const wrapperClass = embedded
    ? "p-3"
    : "card shadow-sm border-0 bg-white mb-3";

  return (
    <div className={wrapperClass}>
      <div className={embedded ? undefined : "card-body"}>
        {!embedded && (
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Live Proctoring Monitor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time violation logs from active test sessions
                {lastFetchedAt ? ` · Updated ${formatEventTime(lastFetchedAt)}` : ""}
              </Typography>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant={paused ? "success" : "outline-secondary"}
                size="sm"
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                Refresh
              </Button>
            </div>
          </div>
        )}

        <div className="row g-2 mb-3">
          {isLiveOngoing ? (
            <>
              <div className="col-6">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Students
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#2563eb" }}>
                    {totalStudents}
                  </Typography>
                </Paper>
              </div>
              <div className="col-6">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Appeared
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#6f42c1" }}>
                    {appearedStudents}
                  </Typography>
                </Paper>
              </div>
            </>
          ) : (
            <>
              <div className="col-6 col-md-3">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Students
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#2563eb" }}>
                    {totalStudents}
                  </Typography>
                </Paper>
              </div>
              <div className="col-6 col-md-3">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Appeared
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#6f42c1" }}>
                    {appearedStudents}
                  </Typography>
                </Paper>
              </div>
              <div className="col-6 col-md-3">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {stats.max_violation_attempts > 0
                      ? `Terminated (${stats.max_violation_attempts}${stats.max_violation_attempts === 1 ? "st" : stats.max_violation_attempts === 2 ? "nd" : stats.max_violation_attempts === 3 ? "rd" : "th"} strike)`
                      : "Terminated"}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#dc2626" }}>
                    {stats.violated_students}
                  </Typography>
                </Paper>
              </div>
              <div className="col-6 col-md-3">
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Total violations
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.total_violation_events}
                  </Typography>
                </Paper>
              </div>
            </>
          )}
        </div>

        {error && <Alert variant="warning">{error}</Alert>}

        {loading && sortedStudents.length === 0 ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading live logs...
          </div>
        ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: embedded ? 520 : 360 }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx} align="center">
                    Sl.No
                  </TableCell>
                  <TableCell sx={headerCellSx} />
                  <TableCell sx={headerCellSx}>Student</TableCell>
                  <TableCell sx={headerCellSx} align="center">
                    Int %
                  </TableCell>
                  <TableCell sx={headerCellSx}>Session</TableCell>
                  <TableCell sx={headerCellSx}>Last violation</TableCell>
                  <TableCell sx={headerCellSx}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No students assigned to this test yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((student, index) => (
                    <StudentViolationRow
                      key={student.student_id}
                      slNo={index + 1}
                      student={student}
                      events={eventsByStudent[student.student_id] ?? []}
                      expanded={expandedStudentId === student.student_id}
                      onToggle={() =>
                        setExpandedStudentId((prev) =>
                          prev === student.student_id ? null : student.student_id
                        )
                      }
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
};

export default ProctoringLiveMonitor;
