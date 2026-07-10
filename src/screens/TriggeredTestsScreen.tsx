import { useState } from "react";
import { Badge, Button, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AttendanceLaunchModal from "../components/AttendanceLaunchModal";
import TestPageShell from "../components/TestPageShell";
import { formatAssignDate, formatAssignTime } from "../constants/assignTestConstants";
import {
  createAttendanceSession,
  getStudentCountForBatch,
  toLaunchContext,
} from "../data/attendanceMockData";
import { MOCK_TRIGGERED_TESTS } from "../data/sftMockData";
import type { TriggeredTestRow } from "../data/sftMockData";

export default function TriggeredTestsScreen() {
  const navigate = useNavigate();
  const [launchRow, setLaunchRow] = useState<TriggeredTestRow | null>(null);

  const handleLaunch = (groupSizes: number[]) => {
    if (!launchRow) return;
    const session = createAttendanceSession(toLaunchContext(launchRow), groupSizes);
    setLaunchRow(null);
    navigate(`/attendance/${session.id}`);
  };

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white fw-semibold">
            Assigned / Triggered Tests
          </div>
          <div className="card-body p-0">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Test Name</th>
                  <th>Trainer</th>
                  <th>Scheduled</th>
                  <th>Triggered</th>
                  <th>Course / Batch</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TRIGGERED_TESTS.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold small">{row.testName}</td>
                    <td>{row.trainerName}</td>
                    <td className="small">
                      {formatAssignDate(row.scheduledDate)} ·{" "}
                      {formatAssignTime(row.scheduledTime)}
                    </td>
                    <td className="small text-muted">
                      {row.triggerDate
                        ? `${formatAssignDate(row.triggerDate)} · ${formatAssignTime(row.triggerTime ?? "")}`
                        : "—"}
                    </td>
                    <td className="small">
                      {row.course} · {row.batch}
                    </td>
                    <td>
                      <Badge
                        bg={
                          row.status === "Live"
                            ? "danger"
                            : row.status === "Completed"
                              ? "secondary"
                              : "warning"
                        }
                        text={row.status === "Scheduled" ? "dark" : undefined}
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {row.status !== "Completed" && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setLaunchRow(row)}
                        >
                          Launch Attendance
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      <AttendanceLaunchModal
        show={Boolean(launchRow)}
        testName={launchRow?.testName ?? ""}
        batch={launchRow?.batch ?? ""}
        totalStudents={
          launchRow ? getStudentCountForBatch(launchRow.batch) : 0
        }
        onHide={() => setLaunchRow(null)}
        onLaunch={handleLaunch}
      />
    </TestPageShell>
  );
}
