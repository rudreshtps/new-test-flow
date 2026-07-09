import { Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_COMPLETED_TESTS } from "../data/sftMockData";
import { formatAssignDate, formatAssignTime } from "../constants/assignTestConstants";

export default function CompletedTestsScreen() {
  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white fw-semibold">
            Completed Test Details
          </div>
          <div className="card-body p-0">
            <Table responsive hover className="mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Test</th>
                  <th>Assigned</th>
                  <th>Duration</th>
                  <th>Course / Batch</th>
                  <th>Attempted</th>
                  <th>Absent</th>
                  <th>Unassigned</th>
                  <th>Trainer</th>
                  <th>Violations</th>
                  <th>MCQ / Coding</th>
                  <th>Difficulty</th>
                  <th>Topics</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COMPLETED_TESTS.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.testName}</td>
                    <td>
                      {formatAssignDate(row.assignedDate)} ·{" "}
                      {formatAssignTime(row.assignedTime)}
                    </td>
                    <td>{row.durationMinutes} min</td>
                    <td>
                      {row.course} · {row.batch}
                    </td>
                    <td>{row.studentsAttempted}</td>
                    <td>{row.absentCount}</td>
                    <td>{row.unassignedCount}</td>
                    <td>{row.trainerName}</td>
                    <td>{row.proctoringViolations}</td>
                    <td>
                      {row.mcqCount} / {row.codingCount}
                    </td>
                    <td>{row.difficulty}</td>
                    <td>{row.topicsCovered}</td>
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
