import { useState } from "react";
import { Alert, Badge, Button, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_LIVE_SESSION } from "../data/mockData";
import type { Student } from "../types";

export default function AttendanceScreen() {
  const session = MOCK_LIVE_SESSION;
  const [students, setStudents] = useState<Student[]>(session.students);
  const [windowRemaining, setWindowRemaining] = useState(session.attendanceWindowRemaining);

  const windowTotal = session.attendanceWindowMinutes;
  const windowUsed = windowTotal - windowRemaining;
  const windowPercent = (windowUsed / windowTotal) * 100;

  const markAttendance = (id: string, status: "Present" | "Absent") => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              attendanceStatus: status,
              testStatus: status === "Present" ? "In Progress" : "Absent",
            }
          : s
      )
    );
  };

  const pendingCount = students.filter((s) => s.attendanceStatus === "Pending").length;

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="row g-3 mb-3">
          <div className="col-md-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Attendance Window</span>
                <span className="text-danger small fw-semibold d-flex align-items-center gap-1">
                  <span className="live-pulse" /> OPEN
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold">25%</div>
                    <div className="text-secondary small">Of duration</div>
                  </div>
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold">{windowTotal}m</div>
                    <div className="text-secondary small">Window</div>
                  </div>
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold text-warning">{windowRemaining}m</div>
                    <div className="text-secondary small">Remaining</div>
                  </div>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                  <span>
                    Used: {windowUsed}m of {windowTotal}m
                  </span>
                  <span>{Math.round(windowPercent)}%</span>
                </div>
                <div className="progress mb-2" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${windowPercent}%` }}
                  />
                </div>
                <p className="text-secondary small mb-2">
                  Started {session.startedAt} · Closes 09:30 AM
                </p>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setWindowRemaining((r) => Math.max(0, r - 5))}
                >
                  Simulate −5 min
                </Button>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-semibold">Summary</div>
              <div className="card-body d-flex gap-2 flex-wrap">
                <div className="p-2 bg-light rounded border flex-fill text-center">
                  <div className="fw-bold text-success">
                    {students.filter((s) => s.attendanceStatus === "Present").length}
                  </div>
                  <div className="text-secondary small">Present</div>
                </div>
                <div className="p-2 bg-light rounded border flex-fill text-center">
                  <div className="fw-bold text-danger">
                    {students.filter((s) => s.attendanceStatus === "Absent").length}
                  </div>
                  <div className="text-secondary small">Absent</div>
                </div>
                <div className="p-2 bg-light rounded border flex-fill text-center">
                  <div className="fw-bold text-warning">{pendingCount}</div>
                  <div className="text-secondary small">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between">
            <span className="fw-semibold">Mark Attendance</span>
            {pendingCount > 0 && <Badge bg="warning" text="dark">{pendingCount} pending</Badge>}
          </div>
          <div className="card-body p-0">
            <Table responsive className="mb-0 test-sticky-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>College</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="text-secondary">{s.id}</td>
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
                            : s.testStatus === "Absent"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {s.testStatus}
                      </Badge>
                    </td>
                    <td>
                      {s.attendanceStatus === "Pending" && windowRemaining > 0 ? (
                        <div className="d-flex gap-1">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => markAttendance(s.id, "Present")}
                          >
                            Present
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => markAttendance(s.id, "Absent")}
                          >
                            Absent
                          </Button>
                        </div>
                      ) : s.attendanceStatus === "Pending" ? (
                        <span className="text-secondary small">Window closed</span>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0"
                          onClick={() =>
                            setStudents((prev) =>
                              prev.map((st) =>
                                st.id === s.id
                                  ? { ...st, attendanceStatus: "Pending", testStatus: "Assigned" }
                                  : st
                              )
                            )
                          }
                        >
                          Reset
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        {windowRemaining === 0 && pendingCount > 0 && (
          <Alert variant="warning" className="mt-3 py-2">
            Window closed. {pendingCount} student(s) will be auto-marked Absent.
          </Alert>
        )}
      </div>
    </TestPageShell>
  );
}
