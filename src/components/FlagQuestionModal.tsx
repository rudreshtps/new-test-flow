import { Alert, Badge, Button, Modal, Table } from "react-bootstrap";
import {
  flagQuestion,
  getQuestionUsage,
  isQuestionUsedInAnyTest,
  type FlaggedQuestionState,
} from "../data/questionFlagData";
import { getQuestionById } from "../data/questionBank";

type FlagQuestionModalProps = {
  show: boolean;
  questionId: string | null;
  flaggedBy?: string;
  onHide: () => void;
  onFlagged: (result: FlaggedQuestionState) => void;
};

const NOTIFY_ROLES = ["Admin", "Head Trainer", "Content Creator"];

export default function FlagQuestionModal({
  show,
  questionId,
  flaggedBy = "Trainer",
  onHide,
  onFlagged,
}: FlagQuestionModalProps) {
  if (!questionId) return null;

  const question = getQuestionById(questionId);
  const usages = getQuestionUsage(questionId);
  const used = isQuestionUsedInAnyTest(questionId);

  const handleFlag = () => {
    const result = flagQuestion(questionId, flaggedBy);
    onFlagged(result);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Flag Question — {questionId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {question && (
          <div className="bg-light rounded p-3 mb-3 small">{question.text}</div>
        )}

        <Alert variant="info" className="py-2 small">
          The system will immediately notify:{" "}
          <strong>{NOTIFY_ROLES.join(", ")}</strong>.
        </Alert>

        {!used ? (
          <Alert variant="success" className="py-2 small mb-0">
            This question has <strong>not been used</strong> in any test. It can be{" "}
            <strong>disabled</strong> after flagging.
          </Alert>
        ) : (
          <>
            <Alert variant="warning" className="py-2 small">
              This question is <strong>already used</strong> — it cannot be disabled.
              Usage details:
            </Alert>
            <Table size="sm" bordered className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Test ID</th>
                  <th>Course</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u) => (
                  <tr key={`${u.testId}-${u.batch}`}>
                    <td>{u.testId}</td>
                    <td>{u.course}</td>
                    <td>{u.batch}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleFlag}>
          Flag Question
          {!used && (
            <Badge bg="dark" className="ms-2">
              + Disable
            </Badge>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
