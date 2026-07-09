import { Alert, Badge, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import {
  FINAL_TEST_GENERATE_LIMIT,
  getGenerateCount,
  getUnusedGenerationCount,
  loadTrainerPerformanceEvents,
  MOCK_TRAINER_NAME,
} from "../utils/finalTestFlow";

export default function TrainerPerformanceScreen() {
  const events = loadTrainerPerformanceEvents();
  const generateCount = getGenerateCount();
  const unusedCount = getUnusedGenerationCount();
  const overLimit = generateCount > FINAL_TEST_GENERATE_LIMIT;
  const repeatedUnused = unusedCount >= 3;

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="d-flex gap-3 mb-3 flex-wrap">
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{generateCount}</div>
            <div className="text-secondary small">
              Final test generations (limit {FINAL_TEST_GENERATE_LIMIT})
            </div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{unusedCount}</div>
            <div className="text-secondary small">Unused generations</div>
          </div>
        </div>

        {overLimit && (
          <Alert variant="danger" className="py-2 small">
            <strong>Admin &amp; Head Trainer notified:</strong> {MOCK_TRAINER_NAME}{" "}
            exceeded the allowed generation limit ({FINAL_TEST_GENERATE_LIMIT}).
          </Alert>
        )}

        {repeatedUnused && (
          <Alert variant="warning" className="py-2 small">
            <strong>Head Trainer notified:</strong> repeated unused final test
            generations recorded for performance evaluation.
          </Alert>
        )}

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white fw-semibold">
            Generation History — {MOCK_TRAINER_NAME}
          </div>
          <div className="card-body p-0">
            {events.length === 0 ? (
              <div className="p-4 text-muted small text-center">
                No generation events yet. Generate a Subject or Overall Final Test
                on the assign screen.
              </div>
            ) : (
              <Table responsive hover className="mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Test Name</th>
                    <th>Subject</th>
                    <th>Course</th>
                    <th>Generated</th>
                    <th>Used</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="fw-semibold">{e.testName}</td>
                      <td>{e.subject}</td>
                      <td>{e.course}</td>
                      <td>{new Date(e.generatedAt).toLocaleString()}</td>
                      <td>
                        <Badge bg={e.used ? "success" : "warning"} text={e.used ? undefined : "dark"}>
                          {e.used ? "Used" : "Unused"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </TestPageShell>
  );
}
