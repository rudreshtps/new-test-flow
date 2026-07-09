import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Table } from "react-bootstrap";
import { countQuestionsInPool, getQuestionById } from "../data/questionBank";
import type { ScheduleQuestionConfig } from "../types";
import { getSwapCandidates } from "../utils/questionSelection";

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
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState("");

  useEffect(() => {
    if (!show || !config) return;
    setQuestionIds(config.questionIds);
    setSwapTargetId(null);
    setReplacementId("");
  }, [show, config]);

  const questions = useMemo(
    () =>
      questionIds
        .map((id) => getQuestionById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q)),
    [questionIds]
  );

  const swapMetaByQuestionId = useMemo(() => {
    if (!config) return new Map<string, { count: number; inDb: number }>();
    return new Map(
      questions.map((question) => {
        const inDb = countQuestionsInPool(
          config.logic.subject,
          question.subtopic,
          question.type
        );
        const count = getSwapCandidates(
          config.logic,
          question.id,
          questionIds
        ).length;
        return [question.id, { count, inDb }];
      })
    );
  }, [config, questions, questionIds]);

  const swapCandidates =
    config && swapTargetId
      ? getSwapCandidates(config.logic, swapTargetId, questionIds)
      : [];

  const handleSwap = () => {
    if (!swapTargetId || !replacementId) return;
    setQuestionIds((prev) =>
      prev.map((id) => (id === swapTargetId ? replacementId : id))
    );
    setSwapTargetId(null);
    setReplacementId("");
  };

  if (!config) return null;

  const swapAvailableCount = questions.filter(
    (q) => (swapMetaByQuestionId.get(q.id)?.count ?? 0) > 0
  ).length;
  const noSwapCount = questions.length - swapAvailableCount;

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered scrollable>
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
                    {noSwapCount} row(s) — no swap (only 1 in DB for subtopic)
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
                    <th>In DB</th>
                    <th>Swap</th>
                    {showFlagAction && <th>Flag</th>}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => {
                    const meta = swapMetaByQuestionId.get(question.id);
                    const swapCount = meta?.count ?? 0;
                    const inDb = meta?.inDb ?? 0;
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
                        <td>{question.text}</td>
                        <td>{question.type}</td>
                        <td>{question.marks}</td>
                        <td className="small text-muted text-center">
                          {inDb} {question.type}
                        </td>
                        <td className="text-end">
                          {canSwap ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title={`${swapCount} replacement(s) available in DB`}
                              onClick={() => {
                                setSwapTargetId(question.id);
                                setReplacementId("");
                              }}
                            >
                              Swap ({swapCount})
                            </Button>
                          ) : (
                            <span
                              className="text-muted small"
                              title={`Only 1 ${question.type} question in DB for "${question.subtopic}" — nothing to swap`}
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
            Regenerate All replaces every question using saved logic.
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

      <Modal
        show={Boolean(swapTargetId)}
        onHide={() => {
          setSwapTargetId(null);
          setReplacementId("");
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">
            Swap Question — {swapTargetId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {swapTargetId && getQuestionById(swapTargetId) && (
            <div className="bg-light rounded p-2 mb-3 small">
              <strong>Current:</strong> {getQuestionById(swapTargetId)?.text}
              <div className="text-muted mt-1">
                Same subtopic &amp; type only ·{" "}
                {swapCandidates.length} replacement(s) in DB
              </div>
            </div>
          )}
          {swapCandidates.length === 0 ? (
            <Alert variant="warning" className="mb-0 py-2 small">
              No replacement questions available for the same subtopic and type.
            </Alert>
          ) : (
            swapCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`mb-2 p-2 rounded border${
                  replacementId === candidate.id ? " border-primary bg-light" : ""
                }`}
              >
                <Form.Check
                  type="radio"
                  name="replacement-question"
                  id={`swap-${candidate.id}`}
                  checked={replacementId === candidate.id}
                  onChange={() => setReplacementId(candidate.id)}
                  label={
                    <span className="small">
                      <strong>{candidate.id}</strong> — {candidate.text}
                      <Badge bg="secondary" className="ms-2">
                        L{candidate.level}
                      </Badge>
                      <span className="text-muted ms-2">
                        {candidate.topic} / {candidate.subtopic}
                      </span>
                    </span>
                  }
                />
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setSwapTargetId(null);
              setReplacementId("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!replacementId}
            onClick={handleSwap}
          >
            Confirm Swap
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
