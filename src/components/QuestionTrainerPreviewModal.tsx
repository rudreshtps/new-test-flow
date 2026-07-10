import { useMemo } from "react";
import { Badge, Button, Modal } from "react-bootstrap";
import { isQuestionFlagged } from "../data/questionFlagData";
import {
  buildStudentMcqQuestion,
  buildStudentPythonQuestion,
  buildStudentSqlQuestion,
  getStudentEditorKind,
} from "../data/studentFlowQuestionAdapter";
import { getQuestionById } from "../data/questionBank";
import McqTrainerPreview from "./trainerPreview/McqTrainerPreview";
import PythonTrainerPreview from "./trainerPreview/PythonTrainerPreview";
import SqlTrainerPreview from "./trainerPreview/SqlTrainerPreview";
import "../styles/StudentEditor.css";

type QuestionTrainerPreviewModalProps = {
  questionId: string | null;
  onHide: () => void;
  onFlagQuestion?: (questionId: string) => void;
};

export default function QuestionTrainerPreviewModal({
  questionId,
  onHide,
  onFlagQuestion,
}: QuestionTrainerPreviewModalProps) {
  const question = questionId ? getQuestionById(questionId) : null;
  const editorKind = questionId ? getStudentEditorKind(questionId) : null;

  const mcqQuestion = useMemo(
    () => (questionId && editorKind === "mcq" ? buildStudentMcqQuestion(questionId) : null),
    [editorKind, questionId]
  );
  const sqlQuestion = useMemo(
    () => (questionId && editorKind === "sql" ? buildStudentSqlQuestion(questionId) : null),
    [editorKind, questionId]
  );
  const pythonQuestion = useMemo(
    () =>
      questionId && editorKind === "python" ? buildStudentPythonQuestion(questionId) : null,
    [editorKind, questionId]
  );

  return (
    <Modal
      show={Boolean(questionId && editorKind)}
      onHide={onHide}
      size="xl"
      centered
      scrollable
      className="test-flow-modal"
      dialogClassName="question-trainer-preview-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 d-flex align-items-center gap-2 flex-wrap">
          <span>Question Preview</span>
          {question && (
            <>
              <Badge bg="secondary">{question.id}</Badge>
              <Badge bg={question.type === "MCQ" ? "info" : "primary"}>
                {question.type}
              </Badge>
              <Badge bg="light" text="dark" className="border">
                L{question.level}
              </Badge>
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        {question && (
          <div className="small text-muted mb-3">
            {question.subject} · {question.topic} · {question.subtopic} ·{" "}
            {question.marks} marks — trainer preview uses the same editor layout as the
            student app (RUN enabled, submit hidden).
          </div>
        )}
        {mcqQuestion && <McqTrainerPreview question={mcqQuestion} />}
        {sqlQuestion && <SqlTrainerPreview question={sqlQuestion} />}
        {pythonQuestion && <PythonTrainerPreview question={pythonQuestion} />}
      </Modal.Body>
      <Modal.Footer>
        {questionId && onFlagQuestion && (
          <Button
            variant="outline-warning"
            className="me-auto"
            disabled={isQuestionFlagged(questionId)}
            onClick={() => onFlagQuestion(questionId)}
          >
            {isQuestionFlagged(questionId) ? "Already Flagged" : "Flag Question"}
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
