import { useState } from "react";
import { Badge, Button, Form, Modal, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { MOCK_LIVE_SESSION, MOCK_QUESTIONS } from "../data/mockData";

const REPLACEMENT_POOL = MOCK_QUESTIONS.filter(
  (q) => !["Q-201", "Q-102", "Q-301"].includes(q.id)
);

export default function QuestionSwapScreen() {
  const [selectedStudent, setSelectedStudent] = useState(
    MOCK_LIVE_SESSION.students.find((s) => s.testStatus === "In Progress")!
  );
  const [showModal, setShowModal] = useState(false);
  const [replacementId, setReplacementId] = useState("");

  const currentQuestion = MOCK_QUESTIONS.find(
    (q) => q.id === selectedStudent.currentQuestionId
  );

  const handleSwap = () => {
    setShowModal(false);
  };

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="row g-3">
          <div className="col-md-5">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Select Student</span>
                <span className="text-danger small fw-semibold d-flex align-items-center gap-1">
                  <span className="live-pulse" /> LIVE
                </span>
              </div>
              <div className="card-body p-0">
                <Table responsive size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Current Q</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LIVE_SESSION.students
                      .filter((s) => s.testStatus === "In Progress")
                      .map((s) => (
                        <tr
                          key={s.id}
                          style={{
                            cursor: "pointer",
                            background:
                              selectedStudent.id === s.id ? "#eff6ff" : undefined,
                          }}
                          onClick={() => setSelectedStudent(s)}
                        >
                          <td className="fw-semibold">{s.name}</td>
                          <td>{s.currentQuestionId}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between">
                <span className="fw-semibold">Current Question</span>
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  Swap Question
                </Button>
              </div>
              <div className="card-body">
                <p className="text-secondary small mb-2">
                  Student: <strong>{selectedStudent.name}</strong>
                </p>
                {currentQuestion && (
                  <div className="p-3 bg-light rounded border border-primary">
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <strong>{currentQuestion.id}</strong>
                      <Badge bg="secondary">L{currentQuestion.level}</Badge>
                      <Badge bg="primary">{currentQuestion.type}</Badge>
                      <Badge bg="warning" text="dark">
                        {currentQuestion.marks} marks
                      </Badge>
                    </div>
                    <p className="mb-1">{currentQuestion.text}</p>
                    <p className="text-secondary small mb-0">{currentQuestion.topic}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-3">
          <div className="card-header bg-white fw-semibold">Swap Audit Log</div>
          <div className="card-body p-0">
            <Table responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Student</th>
                  <th>Original</th>
                  <th>Replaced</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-secondary">09:12 AM</td>
                  <td>admin@lms.com</td>
                  <td>Priya Nair</td>
                  <td>Q-105</td>
                  <td>Q-203</td>
                  <td className="text-secondary">Question ambiguity</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-semibold">Swap Question</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-secondary small mb-3">
            Replacing <strong>{currentQuestion?.id}</strong> for{" "}
            <strong>{selectedStudent.name}</strong>
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Reason</Form.Label>
            <Form.Select>
              <option>Question ambiguity</option>
              <option>Technical issue</option>
              <option>Duplicate question</option>
              <option>Admin discretion</option>
            </Form.Select>
          </Form.Group>
          {REPLACEMENT_POOL.map((q) => (
            <div
              key={q.id}
              className={`mb-2 p-2 rounded border${replacementId === q.id ? " border-primary bg-light" : ""}`}
            >
              <Form.Check
                type="radio"
                name="replacement"
                id={`rep-${q.id}`}
                checked={replacementId === q.id}
                onChange={() => setReplacementId(q.id)}
                label={
                  <span>
                    <strong>{q.id}</strong> — {q.text}
                    <Badge bg="secondary" className="ms-2">
                      L{q.level}
                    </Badge>
                  </span>
                }
              />
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!replacementId} onClick={handleSwap}>
            Confirm Swap
          </Button>
        </Modal.Footer>
      </Modal>
    </TestPageShell>
  );
}
