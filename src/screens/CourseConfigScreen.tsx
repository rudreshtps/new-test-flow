import { Badge, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";

const COURSE_PLACEHOLDERS = [
  {
    course: "12M 2026",
    subject: "SQL",
    placeholderName: "SQL  - 12M 2026 - FT###",
    type: "Subject Final Test",
    configuredAtAssign: true,
  },
  {
    course: "12M 2026",
    subject: "Python",
    placeholderName: "Python  - 12M 2026 - FT###",
    type: "Subject Final Test",
    configuredAtAssign: true,
  },
  {
    course: "12M 2026",
    subject: "SQL-Python-DSA",
    placeholderName: "OT - 12M 2026 - ### - SQL-Python-DSA",
    type: "Overall Test",
    configuredAtAssign: true,
  },
];

export default function CourseConfigScreen() {
  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <p className="text-muted small mb-3">
          Course configuration holds <strong>placeholders only</strong>. Questions
          and level rules are applied when the test is assigned to batches.
        </p>
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white fw-semibold">
            Final Test Placeholders in Course
          </div>
          <div className="card-body p-0">
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Placeholder Name</th>
                  <th>Configured</th>
                </tr>
              </thead>
              <tbody>
                {COURSE_PLACEHOLDERS.map((row) => (
                  <tr key={`${row.course}-${row.subject}-${row.type}`}>
                    <td>{row.course}</td>
                    <td>{row.subject}</td>
                    <td>{row.type}</td>
                    <td className="fw-semibold small">{row.placeholderName}</td>
                    <td>
                      <Badge bg="secondary">At assign only</Badge>
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
