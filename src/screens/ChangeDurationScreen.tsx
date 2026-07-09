import { useState } from "react";
import { Alert, Badge, Button, Form, Modal, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_LIVE_SESSION } from "../data/mockData";
import { formatDuration } from "../data/mockData";

export default function ChangeDurationScreen() {
  const session = MOCK_LIVE_SESSION;
  const [newDuration, setNewDuration] = useState(session.durationMinutes);
  const [showConfirm, setShowConfirm] = useState(false);

  const remaining = session.durationMinutes - session.elapsedMinutes;
  const newRemaining = newDuration - session.elapsedMinutes;
  const delta = newDuration - session.durationMinutes;

  const handleApply = () => {
    setShowConfirm(false);
  };

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Current Session</span>
                <span className="text-danger small fw-semibold d-flex align-items-center gap-1">
                  <span className="live-pulse" /> LIVE
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold">{formatDuration(session.durationMinutes)}</div>
                    <div className="text-secondary small">Original</div>
                  </div>
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold">{session.elapsedMinutes}m</div>
                    <div className="text-secondary small">Elapsed</div>
                  </div>
                  <div className="p-2 bg-light rounded border flex-fill text-center">
                    <div className="fw-bold">{remaining}m</div>
                    <div className="text-secondary small">Remaining</div>
                  </div>
                </div>
                <div className="progress mb-2" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{
                      width: `${(session.elapsedMinutes / session.durationMinutes) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-secondary small mb-0">
                  Started {session.startedAt} · Original end 11:00 AM
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white fw-semibold">Adjust Duration</div>
              <div className="card-body">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">New Total Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={newDuration}
                    min={session.elapsedMinutes + 5}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                  />
                </Form.Group>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  {[15, 30, -15, -30].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setNewDuration(
                          Math.max(session.elapsedMinutes + 5, newDuration + mins)
                        )
                      }
                    >
                      {mins > 0 ? `+${mins}m` : `${mins}m`}
                    </Button>
                  ))}
                </div>
                <Alert variant="info" className="py-2 small mb-3">
                  Change:{" "}
                  <strong className={delta >= 0 ? "text-success" : "text-danger"}>
                    {delta >= 0 ? "+" : ""}
                    {delta} min
                  </strong>
                  {" · "}
                  New remaining: <strong>{newRemaining} min</strong>
                </Alert>
                <Button
                  variant="primary"
                  className="w-100"
                  disabled={newDuration === session.durationMinutes}
                  onClick={() => setShowConfirm(true)}
                >
                  Apply Duration Change
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-3">
          <div className="card-header bg-white d-flex justify-content-between">
            <span className="fw-semibold">Affected Students</span>
            <Badge bg="primary">
              {session.students.filter((s) => s.testStatus === "In Progress").length} active
            </Badge>
          </div>
          <div className="card-body p-0">
            <Table responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Current Remaining</th>
                  <th>After Change</th>
                </tr>
              </thead>
              <tbody>
                {session.students
                  .filter((s) => s.testStatus === "In Progress")
                  .map((s) => (
                    <tr key={s.id}>
                      <td className="fw-semibold">{s.name}</td>
                      <td>
                        <Badge bg="primary">In Progress</Badge>
                      </td>
                      <td>{remaining} min</td>
                      <td className="fw-semibold">{newRemaining} min</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-semibold">Confirm Duration Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Change from <strong>{formatDuration(session.durationMinutes)}</strong> to{" "}
          <strong>{formatDuration(newDuration)}</strong>?
          <p className="text-secondary small mt-2 mb-0">
            Active students will be notified of the new end time.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Confirm & Notify
          </Button>
        </Modal.Footer>
      </Modal>
    </TestPageShell>
  );
}
