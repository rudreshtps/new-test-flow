import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  ProgressBar,
  Row,
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProvisionStudentAttendanceGrid from "../components/ProvisionStudentAttendanceGrid";
import TestPageShell from "../components/TestPageShell";
import {
  DEFAULT_IMAGE_TIMER_SECONDS,
  IMAGE_EXTEND_SECONDS,
  WINDOW_EXTEND_MINUTES,
  autoCloseAttendanceWindow,
  generateAttendanceGroups,
  getAttendanceSummary,
  loadAttendanceSession,
  saveAttendanceSession,
} from "../data/attendanceMockData";
import type { AttendanceSession, AttendanceStudentRecord } from "../types/attendance";

export default function AttendanceScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [windowClosedNotice, setWindowClosedNotice] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const loaded = loadAttendanceSession(sessionId);
    if (!loaded) {
      navigate("/triggered-tests", { replace: true });
      return;
    }
    setSession(loaded);
  }, [navigate, sessionId]);

  useEffect(() => {
    if (!session?.imageTimerActive || session.imageTimerSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const nextSeconds = prev.imageTimerSeconds - 1;
        const next = {
          ...prev,
          imageTimerSeconds: Math.max(0, nextSeconds),
          imageTimerActive: nextSeconds > 0,
        };
        saveAttendanceSession(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.imageTimerActive, session?.imageTimerSeconds]);

  useEffect(() => {
    if (!session || session.attendanceWindowRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.attendanceWindowRemaining <= 0) return prev;
        const nextRemaining = prev.attendanceWindowRemaining - 1;
        if (nextRemaining <= 0) {
          const closed = autoCloseAttendanceWindow({
            ...prev,
            attendanceWindowRemaining: 0,
          });
          saveAttendanceSession(closed);
          setWindowClosedNotice(true);
          return closed;
        }
        const next = { ...prev, attendanceWindowRemaining: nextRemaining };
        saveAttendanceSession(next);
        return next;
      });
    }, 60000);
    return () => window.clearInterval(timer);
  }, [session?.attendanceWindowRemaining]);

  const summary = useMemo(
    () => getAttendanceSummary(session?.students ?? []),
    [session?.students]
  );

  const updateSession = (updater: (prev: AttendanceSession) => AttendanceSession) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAttendanceSession(next);
      return next;
    });
  };

  const handleStudentsChange = (students: AttendanceStudentRecord[]) => {
    updateSession((prev) => ({ ...prev, students }));
  };

  const handleRelaunchRound = () => {
    if (!session) return;
    updateSession((prev) => ({
      ...prev,
      groups: generateAttendanceGroups(prev.groupSizes),
      imageTimerSeconds: DEFAULT_IMAGE_TIMER_SECONDS,
      imageTimerActive: true,
      roundNo: prev.roundNo + 1,
    }));
  };

  const handleExtendImageTimer = () => {
    updateSession((prev) => ({
      ...prev,
      imageTimerSeconds: prev.imageTimerSeconds + IMAGE_EXTEND_SECONDS,
      imageTimerActive: true,
    }));
  };

  const handleExtendWindow = () => {
    updateSession((prev) => ({
      ...prev,
      attendanceWindowRemaining: prev.attendanceWindowRemaining + WINDOW_EXTEND_MINUTES,
    }));
    setWindowClosedNotice(false);
  };

  const handleSimulateWindow = () => {
    updateSession((prev) => {
      const nextRemaining = Math.max(0, prev.attendanceWindowRemaining - 5);
      if (nextRemaining === 0) {
        const closed = autoCloseAttendanceWindow({
          ...prev,
          attendanceWindowRemaining: 0,
        });
        setWindowClosedNotice(true);
        return closed;
      }
      return { ...prev, attendanceWindowRemaining: nextRemaining };
    });
  };

  if (!session) {
    return (
      <TestPageShell>
        <div className="p-4 text-muted">Loading attendance session…</div>
      </TestPageShell>
    );
  }

  const windowPercent =
    session.attendanceWindowMinutes > 0
      ? Math.round(
          (session.attendanceWindowRemaining / session.attendanceWindowMinutes) * 100
        )
      : 0;

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3 attendance-screen">
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <div className="small text-muted">Test</div>
                <strong>{session.testName}</strong>
              </Col>
              <Col md={2}>
                <div className="small text-muted">Course</div>
                <strong>{session.course}</strong>
              </Col>
              <Col md={2}>
                <div className="small text-muted">Batch</div>
                <strong>{session.batch}</strong>
              </Col>
              <Col md={2}>
                <div className="small text-muted">Trainer</div>
                <strong>{session.trainerName}</strong>
              </Col>
              <Col md={3}>
                <div className="small text-muted">Duration / Window</div>
                <strong>
                  {session.durationMinutes} min · {session.attendanceWindowMinutes} min
                  (25%)
                </strong>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mb-3">
          <Card.Header className="bg-white fw-semibold d-flex justify-content-between align-items-center">
            <span>Attendance Round {session.roundNo}</span>
            <Badge bg={session.imageTimerSeconds > 0 ? "primary" : "danger"}>
              {session.imageTimerSeconds > 0
                ? `${session.imageTimerSeconds}s remaining`
                : "Image round ended"}
            </Badge>
          </Card.Header>
          <Card.Body>
            <ProgressBar className="mb-3">
              <ProgressBar
                variant="success"
                now={summary.presentPercent}
                label={`${summary.presentPercent}%`}
              />
              <ProgressBar
                variant="danger"
                now={summary.absentPercent}
                label={`${summary.absentPercent}%`}
              />
            </ProgressBar>

            <div className="d-flex flex-wrap gap-2 mb-4">
              <Button variant="outline-primary" size="sm" onClick={handleExtendImageTimer}>
                Extend image round (+{IMAGE_EXTEND_SECONDS}s)
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={handleRelaunchRound}>
                Relaunch round
              </Button>
              {session.groups.length > 0 && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="btn-outline-brand"
                  onClick={() => setShowPreviewModal(true)}
                >
                  Preview Images
                </Button>
              )}
            </div>

            <p className="text-muted small mb-3">
              Students split into {session.groups.length} group
              {session.groups.length > 1 ? "s" : ""}. Show each group its image below.
            </p>

            <Row className="g-4">
              {session.groups.map((group) => (
                <Col md={4} key={group.id}>
                  <Card className="group-card h-100">
                    <Card.Body className="text-center">
                      <h5 className="fw-bold mb-3">{group.name}</h5>
                      <p className="text-muted mb-2">
                        Students: {group.studentCount} | Show this image to group
                      </p>
                      <img
                        src={group.imageSrc}
                        alt={group.imageLabel}
                        className="trainer-shown-image mb-3"
                      />
                      <div>
                        <Badge bg="success" className="me-2">
                          Present {summary.presentPercent}%
                        </Badge>
                        <Badge bg="danger">Absent {summary.absentPercent}%</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mb-3">
          <Card.Header className="bg-white fw-semibold">
            Attendance Window (25% of test duration)
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <Badge bg={session.attendanceWindowRemaining > 0 ? "warning" : "secondary"}>
                  {session.attendanceWindowRemaining} min remaining
                </Badge>
                <span className="text-muted small ms-2">
                  of {session.attendanceWindowMinutes} min window
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleSimulateWindow}
                  disabled={session.attendanceWindowRemaining <= 0}
                >
                  Simulate −5 min
                </Button>
                <Button variant="outline-primary" size="sm" onClick={handleExtendWindow}>
                  Extend window (+{WINDOW_EXTEND_MINUTES} min)
                </Button>
              </div>
            </div>

            <ProgressBar
              now={windowPercent}
              variant={windowPercent > 25 ? "success" : "warning"}
              className="mb-3"
              label={`${windowPercent}%`}
            />

            <Row className="g-3 mb-3">
              <Col md={4}>
                <div className="border rounded p-3 text-center">
                  <div className="text-success fw-bold fs-4">{summary.present}</div>
                  <div className="small text-muted">Present</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-3 text-center">
                  <div className="text-danger fw-bold fs-4">{summary.absent}</div>
                  <div className="small text-muted">Absent</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="border rounded p-3 text-center">
                  <div className="text-warning fw-bold fs-4">{summary.pending}</div>
                  <div className="small text-muted">Pending</div>
                </div>
              </Col>
            </Row>

            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="small text-muted">Manual head count</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  placeholder="Students physically present"
                  value={session.headCount ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateSession((prev) => ({
                      ...prev,
                      headCount: value === "" ? null : Number(value),
                    }));
                  }}
                />
              </Col>
              {session.headCount !== null && (
                <Col md={4}>
                  <div className="border rounded p-3 bg-light">
                    <div className="small text-muted">Recorded head count</div>
                    <strong className="fs-5">{session.headCount}</strong>
                  </div>
                </Col>
              )}
            </Row>

            {windowClosedNotice && summary.pending > 0 && (
              <Alert variant="warning" className="mt-3 mb-0 py-2 small">
                Attendance window closed — {summary.pending} pending student(s) auto-marked
                absent (25% rule).
              </Alert>
            )}
          </Card.Body>
        </Card>

        <ProvisionStudentAttendanceGrid
          students={session.students}
          course={session.course}
          batch={session.batch}
          onChange={handleStudentsChange}
        />

        <div className="d-flex flex-wrap gap-2 mt-3">
          <Link to="/assign-test" className="btn btn-secondary">
            Back to Assign Tests
          </Link>
          <Link to="/triggered-tests" className="btn btn-outline-secondary">
            Triggered Tests
          </Link>
        </div>
      </div>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        centered
        className="test-flow-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Group Images Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="preview-images-grid">
            <Row className="g-4 justify-content-center">
              {session.groups.map((group) => (
                <Col xs={6} md={4} key={group.id} className="text-center">
                  <div className="small fw-semibold mb-2">{group.name}</div>
                  <img
                    src={group.imageSrc}
                    alt={group.imageLabel}
                    className="preview-group-image"
                  />
                </Col>
              ))}
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </TestPageShell>
  );
}
