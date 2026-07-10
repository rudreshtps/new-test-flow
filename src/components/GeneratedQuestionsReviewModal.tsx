import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Modal, Table } from "react-bootstrap";
import {
  isQuestionExcludedFromSelection,
  isQuestionFlagged,
  type FlaggedQuestionState,
} from "../data/questionFlagData";
import { getQuestionById } from "../data/questionBank";
import type { ScheduleQuestionConfig } from "../types";
import {
  getSwapCandidates,
  purgeExcludedQuestionsFromSet,
  replaceFlaggedQuestionInSet,
} from "../utils/questionSelection";
import FlagQuestionModal from "./FlagQuestionModal";
import QuestionTrainerPreviewModal from "./QuestionTrainerPreviewModal";

type GeneratedQuestionsReviewModalProps = {
  show: boolean;
  scheduleLabel: string;
  batchNames: string[];
  config: ScheduleQuestionConfig | null;
  warnings: string[];
  onHide: () => void;
  onRegenerate: () => void;
  onConfirm: (questionIds: string[]) => void;
  onFlagged?: (result: FlaggedQuestionState) => void;
};

export default function GeneratedQuestionsReviewModal({
  show,
  scheduleLabel,
  batchNames,
  config,
  warnings,
  onHide,
  onRegenerate,
  onConfirm,
  onFlagged,
}: GeneratedQuestionsReviewModalProps) {
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [swapNotice, setSwapNotice] = useState<string | null>(null);
  const [previewQuestionId, setPreviewQuestionId] = useState<string | null>(null);
  const [flagQuestionId, setFlagQuestionId] = useState<string | null>(null);
  const [flagRevision, setFlagRevision] = useState(0);

  useEffect(() => {
    if (!show || !config) return;

    const purged = purgeExcludedQuestionsFromSet(config.logic, config.questionIds);
    setQuestionIds(purged.questionIds);
    if (purged.notices.length > 0) {
      setSwapNotice(purged.notices.join(" "));
    } else {
      setSwapNotice(null);
    }
    setPreviewQuestionId(null);
    setFlagQuestionId(null);
  }, [show, config]);

  useEffect(() => {
    if (!swapNotice) return;
    const timer = window.setTimeout(() => setSwapNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [swapNotice]);

  const questions = useMemo(
    () =>
      questionIds
        .map((id) => getQuestionById(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q)),
    [questionIds, flagRevision]
  );

  const hasExcludedInSet = questionIds.some((id) =>
    isQuestionExcludedFromSelection(id)
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

  const handleFlagged = (result: FlaggedQuestionState) => {
    if (!config) return;

    setFlagRevision((value) => value + 1);
    const replaced = replaceFlaggedQuestionInSet(
      config.logic,
      questionIds,
      result.questionId
    );
    setQuestionIds(replaced.questionIds);
    setSwapNotice(
      `${replaced.notice}${
        result.disabled
          ? " Question disabled in bank until fixed."
          : " Question remains in bank (used elsewhere) but excluded from new picks."
      }`
    );
    onFlagged?.(result);
    setFlagQuestionId(null);
    setPreviewQuestionId(null);
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
            <Alert
              variant="info"
              className="py-2 small"
              dismissible
              onClose={() => setSwapNotice(null)}
            >
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
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => {
                    const swapCount = swapMetaByQuestionId.get(question.id) ?? 0;
                    const canSwap = swapCount > 0;
                    const flagged = isQuestionFlagged(question.id);

                    return (
                      <tr
                        key={question.id}
                        className={!canSwap ? "table-light" : undefined}
                      >
                        <td className="fw-semibold">
                          {question.id}
                          {flagged && (
                            <Badge bg="warning" text="dark" className="ms-1">
                              Flagged
                            </Badge>
                          )}
                        </td>
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
                        <td className="text-end">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            disabled={flagged}
                            onClick={() => setFlagQuestionId(question.id)}
                          >
                            {flagged ? "Flagged" : "Flag"}
                          </Button>
                        </td>
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
            Flag a question with content issues — it is excluded from selection until
            fixed and auto-replaced in this set. Regenerate All picks a fresh set
            from saved logic.
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
            disabled={questions.length === 0 || hasExcludedInSet}
            title={
              hasExcludedInSet
                ? "Remove or replace flagged questions before confirming"
                : undefined
            }
            onClick={() => onConfirm(questionIds)}
          >
            Confirm &amp; Apply ({questions.length} questions)
          </Button>
        </Modal.Footer>
      </Modal>

      <QuestionTrainerPreviewModal
        questionId={previewQuestionId}
        onHide={() => setPreviewQuestionId(null)}
        onFlagQuestion={(questionId) => setFlagQuestionId(questionId)}
      />

      <FlagQuestionModal
        show={Boolean(flagQuestionId)}
        questionId={flagQuestionId}
        onHide={() => setFlagQuestionId(null)}
        onFlagged={handleFlagged}
      />
    </>
  );
}
