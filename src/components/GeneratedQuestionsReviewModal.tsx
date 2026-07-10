import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Modal, Table } from "react-bootstrap";
import { getQuestionById } from "../data/questionBank";
import type { ScheduleQuestionConfig } from "../types";
import { getSwapCandidates } from "../utils/questionSelection";
import QuestionTrainerPreviewModal from "./QuestionTrainerPreviewModal";

type GeneratedQuestionsReviewModalProps = {
  show: boolean;
  scheduleLabel: string;
  batchNames: string[];
  config: ScheduleQuestionConfig | null;
  warnings: string[];
  showFlagAction?: boolean;
  onHide: () => void;
  onRegenerate: () => void;
  onConfirm: (questionIds: string[]) => void;
  onFlagQuestion?: (questionId: string) => void;
};

export default function GeneratedQuestionsReviewModal({
  show,
  scheduleLabel,
  batchNames,
  config,
  warnings,
  showFlagAction = false,
  onHide,
  onRegenerate,
  onConfirm,
  onFlagQuestion,
}: GeneratedQuestionsReviewModalProps) {
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [swapNotice, setSwapNotice] = useState<string | null>(null);
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !config) return;
    setQuestionIds(config.questionIds);
    setSwapNotice(null);
    setPreviewQuestionId(null);
  }, [show, config]);

  useEffect(() => {
    if (!swapNotice) return;
    const timer = window.setTimeout(() => setSwapNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [swapNotice]);

  const questions = useMemo(
    () =>
      questionIds
        .map((id) => getQuestionById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q)),
    [questionIds]
  );

  const swapMetaByQuestionId = useMemo(() => {
    if (!config) return new Map<string, number>();
    return new Map(
      questions.map((question) => {
        const count = getSwapCandidates(
          config.logic,
          question.id,
          questionIds
        ).length;
        return [question.id, count];
      })
    );
  }, [config, questions, questionIds]);

  const handleRandomSwap = (questionId: string) => {
    if (!config) return;
    const candidates = getSwapCandidates(
      config.logic,
      questionId,
      questionIds
    );
    if (candidates.length === 0) return;

    const replacement =
      candidates[Math.floor(Math.random() * candidates.length)];
    setQuestionIds((prev) =>
      prev.map((id) => (id === questionId ? replacement.id : id))
    );
    setSwapNotice(
      `Swapped ${questionId} with ${replacement.id} — ${replacement.text}`
    );
  };

  if (!config) return null;

  const swapAvailableCount = questions.filter(
    (q) => (swapMetaByQuestionId.get(q.id) ?? 0) > 0
  ).length;
  const noSwapCount = questions.length - swapAvailableCount;

  return (
    <>
    <Modal
      show={show}
      onHide={onHide}
      centered
      scrollable
      dialogClassName="generated-questions-modal"
      className="test-flow-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Generated Questions — {scheduleLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-light rounded p-3 mb-3">
          <div className="fw-semibold small mb-1">
            Shared for {batchNames.length} batch(es)
          </div>
          <div className="text-muted small">{batchNames.join(" · ")}</div>
        </div>

        {swapNotice && (
          <Alert variant="info" className="py-2 small" dismissible onClose={() => setSwapNotice(null)}>
            {swapNotice}
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert variant="warning" className="py-2 small">
            {warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </Alert>
        )}

        {questions.length === 0 ? (
          <div className="text-muted small text-center py-4">
            No questions generated yet.
          </div>
        ) : (
          <>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <Badge bg="success">
                {swapAvailableCount} row(s) — swap available
              </Badge>
              {noSwapCount > 0 && (
                <Badge bg="secondary">
                  {noSwapCount} row(s) — no swap (all alternatives already used
                  for this level)
                </Badge>
              )}
            </div>
            <Table responsive size="sm" className="mb-0 border">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Level</th>
                  <th>Topic / Subtopic</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Marks</th>
                  <th>Swap</th>
                  {showFlagAction && <th>Flag</th>}
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => {
                  const swapCount = swapMetaByQuestionId.get(question.id) ?? 0;
                  const canSwap = swapCount > 0;

                  return (
                    <tr
                      key={question.id}
                      className={!canSwap ? "table-light" : undefined}
                    >
                      <td className="fw-semibold">{question.id}</td>
                      <td>
                        <Badge bg="secondary">L{question.level}</Badge>
                      </td>
                      <td className="small">
                        {question.topic}
                        <div className="text-muted">{question.subtopic}</div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-start text-decoration-none"
                          onClick={() => setPreviewQuestionId(question.id)}
                        >
                          {question.text}
                        </button>
                      </td>
                      <td>{question.type}</td>
                      <td>{question.marks}</td>
                      <td className="text-end">
                        {canSwap ? (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="Pick a random replacement from the question bank"
                            onClick={() => handleRandomSwap(question.id)}
                          >
                            Swap
                          </Button>
                        ) : (
                          <span
                            className="text-muted small"
                            title={`No other L${question.level} ${question.type} questions available in "${question.subtopic}"`}
                          >
                            No swap available
                          </span>
                        )}
                      </td>
                      {showFlagAction && (
                        <td className="text-end">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => onFlagQuestion?.(question.id)}
                          >
                            Flag
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="flex-wrap">
        <div className="text-muted small me-auto">
          Regenerate All replaces every question using saved logic. Swap picks a
          random alternative instantly.
        </div>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="outline-secondary"
          disabled={!config.logicSaved}
          title="Pick a new random set from saved logic"
          onClick={onRegenerate}
        >
          Regenerate All
        </Button>
        <Button
          variant="success"
          disabled={questions.length === 0}
          onClick={() => onConfirm(questionIds)}
        >
          Confirm &amp; Apply ({questions.length} questions)
        </Button>
      </Modal.Footer>
    </Modal>

    <QuestionTrainerPreviewModal
      questionId={previewQuestionId}
      onHide={() => setPreviewQuestionId(null)}
    />
    </>
  );
}
