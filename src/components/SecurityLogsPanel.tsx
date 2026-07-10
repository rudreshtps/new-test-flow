import React, { useEffect, useMemo, useState } from "react";
import {
  BsCameraVideo,
  BsChevronDown,
  BsChevronUp,
  BsClipboard,
  BsExclamationTriangle,
  BsPhone,
  BsWindow,
} from "react-icons/bs";
import { Button, Collapse, Modal, Spinner } from "react-bootstrap";
import { useLiveProctoringFeed } from "../test/useLiveProctoringFeed";
import ProctoringLiveMonitor from "./ProctoringLiveMonitor";
import type {
  LiveProctoringEventItem,
  LiveProctoringStudentItem,
} from "../test/types";

type SecurityLogsPanelProps = {
  testId: string;
  testStatus?: string;
  onViolationsUpdated?: () => void;
};

type ViolationTypeCount = {
  type: string;
  count: number;
};

type StudentViolationDetail = {
  student_id: string;
  student_name?: string;
  count: number;
  violations: LiveProctoringEventItem[];
};

const logIconStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "0.95rem",
};

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

const formatEventTitle = (event: string) => {
  const normalized = event.replace(/_/g, " ").trim();
  if (!normalized) return "Security Alert";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeEventType = (event: string) =>
  event.replace(/_/g, " ").trim().toUpperCase().replace(/ /g, "_");

const eventTypesMatch = (a: string, b: string) =>
  normalizeEventType(a) === normalizeEventType(b);

const formatEventTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatEventDateTime = (value?: string) => {
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

const getStudentInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const eventIcon = (event: string) => {
  const key = event.toUpperCase();
  if (
    key.includes("WEBCAM") ||
    key.includes("FACE") ||
    key.includes("CAMERA") ||
    key.includes("FULLSCREEN")
  ) {
    return <BsCameraVideo style={logIconStyle} />;
  }
  if (
    key.includes("TAB") ||
    key.includes("WINDOW") ||
    key.includes("APPLICATION") ||
    key.includes("FOCUS")
  ) {
    return <BsWindow style={logIconStyle} />;
  }
  if (key.includes("COPY") || key.includes("PASTE") || key.includes("CUT")) {
    return <BsClipboard style={logIconStyle} />;
  }
  if (key.includes("DEVICE") || key.includes("PHONE") || key.includes("OBJECT")) {
    return <BsPhone style={logIconStyle} />;
  }
  return <BsExclamationTriangle style={logIconStyle} />;
};

const aggregateViolationTypeCounts = (
  events: { event: string }[],
  students: { event_counters?: Record<string, number> }[]
): ViolationTypeCount[] => {
  const counts: Record<string, number> = {};

  students.forEach((student) => {
    Object.entries(student.event_counters ?? {}).forEach(([type, count]) => {
      counts[type] = (counts[type] ?? 0) + Number(count);
    });
  });

  if (Object.keys(counts).length === 0) {
    events.forEach((row) => {
      const key = row.event || "UNKNOWN";
      counts[key] = (counts[key] ?? 0) + 1;
    });
  }

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
};

const buildStudentViolationsForType = (
  violationType: string,
  students: LiveProctoringStudentItem[],
  events: LiveProctoringEventItem[]
): StudentViolationDetail[] => {
  const matchingEvents = events.filter((row) =>
    eventTypesMatch(row.event, violationType)
  );
  const studentMap = new Map<string, StudentViolationDetail>();

  students.forEach((student) => {
    const counterEntry = Object.entries(student.event_counters ?? {}).find(
      ([type]) => eventTypesMatch(type, violationType)
    );
    const counterCount = Number(counterEntry?.[1] ?? 0);
    if (counterCount > 0) {
      studentMap.set(student.student_id, {
        student_id: student.student_id,
        student_name: student.student_name,
        count: counterCount,
        violations: [],
      });
    }
  });

  matchingEvents.forEach((event) => {
    let entry = studentMap.get(event.student_id);
    if (!entry) {
      entry = {
        student_id: event.student_id,
        student_name: event.student_name,
        count: 0,
        violations: [],
      };
      studentMap.set(event.student_id, entry);
    }
    entry.violations.push(event);
  });

  return Array.from(studentMap.values())
    .map((row) => ({
      ...row,
      count: Math.max(row.count, row.violations.length),
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (a.student_name ?? a.student_id).localeCompare(
          b.student_name ?? b.student_id
        )
    );
};

const ViolationTypeRow: React.FC<{
  row: ViolationTypeCount;
  onClick: () => void;
}> = ({ row, onClick }) => (
  <button
    type="button"
    className="d-flex align-items-center gap-3 px-4 py-3 border-bottom w-100 text-start bg-white border-0"
    style={{ borderColor: "#eef2f7", cursor: "pointer" }}
    onClick={onClick}
    onMouseEnter={(event) => {
      event.currentTarget.style.backgroundColor = "#f8fafc";
    }}
    onMouseLeave={(event) => {
      event.currentTarget.style.backgroundColor = "#ffffff";
    }}
  >
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-light"
      style={{ width: "2rem", height: "2rem" }}
    >
      {eventIcon(row.type)}
    </div>
    <div
      className="flex-grow-1 fw-semibold"
      style={{ fontSize: "0.82rem", color: "#0f172a" }}
    >
      {formatEventTitle(row.type)}
    </div>
    <div
      className="d-inline-flex align-items-center justify-content-center fw-bold rounded-pill"
      style={{
        minWidth: "1.75rem",
        height: "1.75rem",
        padding: "0 0.5rem",
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        fontSize: "0.75rem",
      }}
    >
      {row.count}
    </div>
  </button>
);

const ViolationTypeStudentRow: React.FC<{
  row: StudentViolationDetail;
  expanded: boolean;
  onToggle: () => void;
}> = ({ row, expanded, onToggle }) => {
  const displayName =
    row.student_name && row.student_name !== row.student_id
      ? row.student_name
      : row.student_id;

  return (
    <div className="border-bottom" style={{ borderColor: "#eef2f7" }}>
      <button
        type="button"
        className="d-flex align-items-center gap-2 w-100 px-4 py-3 border-0 bg-white text-start"
        style={{ cursor: row.violations.length > 0 ? "pointer" : "default" }}
        onClick={row.violations.length > 0 ? onToggle : undefined}
      >
        <span style={studentAvatarStyle}>{getStudentInitials(displayName)}</span>
        <div className="flex-grow-1 min-width-0">
          <div className="fw-semibold small text-truncate">{displayName}</div>
          <div className="text-muted" style={{ fontSize: "0.72rem" }}>
            {row.student_id}
          </div>
        </div>
        <span
          className="d-inline-flex align-items-center justify-content-center fw-bold rounded-pill"
          style={{
            minWidth: "1.75rem",
            height: "1.75rem",
            padding: "0 0.5rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.75rem",
          }}
        >
          {row.count}
        </span>
        {row.violations.length > 0 && (
          <span className="text-muted">
            {expanded ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
          </span>
        )}
      </button>
      <Collapse in={expanded}>
        <div className="px-4 pb-3">
          {row.violations.length === 0 ? (
            <div className="small text-muted ps-4">
              {row.count} violation(s) recorded for this student.
            </div>
          ) : (
            <div className="ps-2">
              {row.violations.map((violation) => (
                <div
                  key={violation.id}
                  className="d-flex justify-content-between gap-3 py-2 border-top small"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div>
                    <div className="fw-medium">
                      {formatEventTitle(violation.event)}
                    </div>
                    {violation.detail && (
                      <div className="text-muted">{violation.detail}</div>
                    )}
                  </div>
                  <div className="text-muted text-nowrap">
                    {formatEventDateTime(violation.event_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
};

const SecurityLogsPanel: React.FC<SecurityLogsPanelProps> = ({
  testId,
  testStatus = "",
  onViolationsUpdated,
}) => {
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [selectedViolationType, setSelectedViolationType] = useState<string | null>(
    null
  );
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const isTestCompleted =
    testStatus.trim().toLowerCase() === "completed" ||
    testStatus.trim().toLowerCase() === "aborted";
  const [liveLogsEnabled, setLiveLogsEnabled] = useState(!isTestCompleted);

  useEffect(() => {
    setLiveLogsEnabled(!isTestCompleted);
  }, [testId, isTestCompleted]);

  const {
    events,
    students,
    stats,
    loading,
    error,
    refresh,
    isLiveConnected,
    isLiveFeedActive,
    isPollingHealthy,
    latestViolation,
  } = useLiveProctoringFeed({
    testId,
    pollIntervalMs: 3000,
    paused: !liveLogsEnabled,
    onNewViolations: onViolationsUpdated,
  });

  const showLiveBadge =
    liveLogsEnabled && (isLiveConnected || isPollingHealthy);

  const violationTypeCounts = useMemo(
    () => aggregateViolationTypeCounts(events, students),
    [events, students]
  );

  const studentsForSelectedType = useMemo(() => {
    if (!selectedViolationType) return [];
    return buildStudentViolationsForType(
      selectedViolationType,
      students,
      events
    );
  }, [selectedViolationType, students, events]);

  const totalViolationCount = useMemo(() => {
    if (stats.total_violation_events > 0) {
      return stats.total_violation_events;
    }
    const fromTypes = violationTypeCounts.reduce((sum, row) => sum + row.count, 0);
    if (fromTypes > 0) return fromTypes;
    if (events.length > 0) return events.length;
    return 0;
  }, [stats.total_violation_events, violationTypeCounts, events.length]);

  const violationBadge = `${totalViolationCount} VIOLATIONS`;

  const handleCloseViolationTypeModal = () => {
    setSelectedViolationType(null);
    setExpandedStudentId(null);
  };

  return (
    <>
      <div
        className="card shadow-sm border-0 bg-white h-100"
        style={{ minHeight: 420 }}
      >
        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Security Logs</span>
            {isLiveFeedActive === false || isTestCompleted ? (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                Completed
              </span>
            ) : showLiveBadge ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                Live
              </span>
            ) : liveLogsEnabled ? (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                Connecting
              </span>
            ) : (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                Paused
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {!isTestCompleted && (
              <Button
                variant={liveLogsEnabled ? "outline-danger" : "outline-success"}
                size="sm"
                onClick={() => setLiveLogsEnabled((value) => !value)}
              >
                {liveLogsEnabled ? "Stop Live" : "Start Live"}
              </Button>
            )}
            <span className="security-logs-badge">{violationBadge}</span>
          </div>
        </div>
        <div className="card-body p-0 d-flex flex-column">
          {latestViolation && (
            <div className="alert alert-danger py-2 px-3 mb-0 rounded-0 border-0 border-bottom small">
              New violation:{" "}
              <strong>{latestViolation.student_id}</strong> —{" "}
              {formatEventTitle(latestViolation.event)}
              {latestViolation.event_at
                ? ` at ${formatEventTime(latestViolation.event_at)}`
                : ""}
            </div>
          )}
          {error && (
            <div className="px-3 pt-3">
              <div className="alert alert-warning py-2 mb-0 small">{error}</div>
            </div>
          )}

          <div className="flex-grow-1 overflow-auto" style={{ maxHeight: 340 }}>
            {loading && totalViolationCount === 0 && violationTypeCounts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading security logs...
              </div>
            ) : totalViolationCount === 0 ? (
              <div className="text-center py-5 text-muted small px-3">
                No security violations recorded yet.
              </div>
            ) : (
              violationTypeCounts.map((row) => (
                <ViolationTypeRow
                  key={row.type}
                  row={row}
                  onClick={() => {
                    setExpandedStudentId(null);
                    setSelectedViolationType(row.type);
                  }}
                />
              ))
            )}
          </div>

          <div className="border-top p-3">
            <Button
              variant="outline-secondary"
              size="sm"
              className="w-100"
              onClick={() => setShowAllLogs(true)}
            >
              View All Logs
            </Button>
          </div>
        </div>
      </div>

      <Modal
        show={selectedViolationType != null}
        onHide={handleCloseViolationTypeModal}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            {selectedViolationType && eventIcon(selectedViolationType)}
            <span>
              {formatEventTitle(selectedViolationType ?? "")} — Students
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {studentsForSelectedType.length === 0 ? (
            <div className="text-center py-5 text-muted small px-3">
              No students found for this violation type.
            </div>
          ) : (
            studentsForSelectedType.map((row) => (
              <ViolationTypeStudentRow
                key={row.student_id}
                row={row}
                expanded={expandedStudentId === row.student_id}
                onToggle={() =>
                  setExpandedStudentId((current) =>
                    current === row.student_id ? null : row.student_id
                  )
                }
              />
            ))
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={showAllLogs}
        onHide={() => setShowAllLogs(false)}
        size="xl"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Security Logs — All Violations</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <ProctoringLiveMonitor
            testId={testId}
            pollIntervalMs={3000}
            embedded
            onRefresh={refresh}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SecurityLogsPanel;
