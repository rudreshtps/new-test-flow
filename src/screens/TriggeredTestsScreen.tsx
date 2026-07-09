import { Badge, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_TRIGGERED_TESTS } from "../data/sftMockData";
import { formatAssignDate, formatAssignTime } from "../constants/assignTestConstants";

export default function TriggeredTestsScreen() {
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
