import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Badge, Button, Form, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_TEST_REPORTS, type TestReportRow } from "../data/sftMockData";

export default function TestReportsScreen() {
  const [params] = useSearchParams();
  const highlightId = params.get("reportId");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [sent, setSent] = useState(false);

  const reports = useMemo(() => MOCK_TEST_REPORTS, []);

  const handleSendEmail = () => {
    setSent(true);
  };

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="mb-1 fw-semibold">Test Reports</h5>
            <div className="text-muted small">
              Auto-generated after test completion
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Form.Check
              type="switch"
              id="email-reports"
              label="Email to Admin, Trainer, Head Trainer, College Coordinator"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!emailEnabled || sent}
              onClick={handleSendEmail}
            >
              {sent ? "Email Sent" : "Send Report Email"}
            </Button>
          </div>
        </div>

        {sent && emailEnabled && (
          <Alert variant="success" className="py-2 small">
            Report email sent to Admin, Trainer, Head Trainer, and College
            Coordinator (mock).
          </Alert>
        )}

        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            highlighted={report.id === highlightId}
          />
        ))}
      </div>
    </TestPageShell>
  );
}

function ReportCard({
  report,
  highlighted,
}: {
  report: TestReportRow;
  highlighted: boolean;
}) {
  return (
    <div
      className={`card shadow-sm border-0 mb-3${highlighted ? " border-primary border-2" : ""}`}
    >
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <span className="fw-semibold">{report.testName}</span>
        <Badge bg="secondary">{report.status}</Badge>
      </div>
      <div className="card-body">
        <div className="row g-2 small mb-3">
          <div className="col-md-4">
            <strong>Course:</strong> {report.courseName}
          </div>
          <div className="col-md-4">
            <strong>Batch:</strong> {report.batchName}
          </div>
          <div className="col-md-4">
            <strong>Subject:</strong> {report.subjectName}
          </div>
        </div>

        <h6 className="fw-semibold">Test Summary</h6>
        <Table size="sm" bordered className="mb-3">
          <tbody>
            <tr>
              <td>Total Students</td>
              <td className="fw-semibold">{report.totalStudents}</td>
            </tr>
            <tr>
              <td>Students Attended</td>
              <td className="fw-semibold text-success">{report.studentsAttended}</td>
            </tr>
            <tr>
              <td>Students Absent</td>
              <td className="fw-semibold text-danger">{report.studentsAbsent}</td>
            </tr>
            <tr>
              <td>Pass</td>
              <td>{report.passPercent}%</td>
            </tr>
            <tr>
              <td>Fail</td>
              <td>{report.failPercent}%</td>
            </tr>
          </tbody>
        </Table>

        <h6 className="fw-semibold">Grade Distribution</h6>
        <div className="d-flex flex-wrap gap-2">
          {report.grades.map((g) => (
            <div key={g.band} className="p-2 border rounded bg-light text-center flex-fill">
              <div className="fw-bold">{g.band}</div>
              <div className="small">
                {g.percent}% · {g.count} students
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
