import { Link } from "react-router-dom";
import { Badge, Table } from "react-bootstrap";
import { BsClock } from "react-icons/bs";
import TestPageShell from "../components/TestPageShell";
import { MOCK_LIVE_SESSION } from "../data/mockData";
import { formatDuration } from "../data/mockData";

export default function LiveMonitorScreen() {
  const session = MOCK_LIVE_SESSION;
  const elapsedPercent = (session.elapsedMinutes / session.durationMinutes) * 100;
  const attendancePercent =
    ((session.attendanceWindowMinutes - session.attendanceWindowRemaining) /
      session.attendanceWindowMinutes) *
    100;

  return (
    <TestPageShell
      headerExtra={
        <div className="d-flex gap-2 align-items-center ms-2">
          <span className="text-danger fw-semibold small d-flex align-items-center gap-1">
            <span className="live-pulse" /> LIVE
          </span>
          <Link to="/question-swap" className="btn btn-outline-secondary btn-sm">
            Question Swap
          </Link>
          <Link to="/change-duration" className="btn btn-outline-secondary btn-sm">
            Change Duration
          </Link>
          <Link to="/attendance" className="btn btn-outline-secondary btn-sm">
            Attendance
          </Link>
        </div>
      }
    >
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="d-flex gap-3 mb-3 flex-wrap">
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{formatDuration(session.durationMinutes)}</div>
            <div className="text-secondary small">Total duration</div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{session.elapsedMinutes}m</div>
            <div className="text-secondary small">Elapsed</div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">
              {session.durationMinutes - session.elapsedMinutes}m
            </div>
            <div className="text-secondary small">Remaining</div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">
              {session.students.filter((s) => s.testStatus === "In Progress").length}
            </div>
            <div className="text-secondary small">Active students</div>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Test Progress</span>
                <span className="text-secondary small">
                  <BsClock className="me-1" />
                  Started {session.startedAt}
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between small mb-1">
                  <span>{session.elapsedMinutes} min elapsed</span>
                  <span>{Math.round(elapsedPercent)}%</span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${elapsedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Attendance Window</span>
                <Badge bg="warning" text="dark">
                  {session.attendanceWindowRemaining}m left
                </Badge>
              </div>
              <div className="card-body">
                <p className="text-secondary small mb-2">
                  25% of {session.durationMinutes} min = {session.attendanceWindowMinutes} min
                </p>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${attendancePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white fw-semibold">Students</div>
          <div className="card-body p-0">
            <Table responsive className="mb-0 test-sticky-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>College</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Current Q</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {session.students.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.name}</td>
                    <td className="text-secondary">{s.college}</td>
                    <td>
                      <Badge
                        bg={
                          s.attendanceStatus === "Present"
                            ? "success"
                            : s.attendanceStatus === "Absent"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {s.attendanceStatus}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={
                          s.testStatus === "In Progress"
                            ? "primary"
                            : s.testStatus === "Completed"
                              ? "success"
                              : "secondary"
                        }
                      >
                        {s.testStatus}
                      </Badge>
                    </td>
                    <td className="text-secondary">{s.currentQuestionId ?? "—"}</td>
                    <td>
                      {s.testStatus === "In Progress" && (
                        <Link to="/question-swap" className="btn btn-link btn-sm p-0">
                          Swap Q
                        </Link>
                      )}
                      {s.attendanceStatus === "Pending" && (
                        <>
                          {" · "}
                          <Link to="/attendance" className="btn btn-link btn-sm p-0">
                            Mark
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </TestPageShell>
  );
}
