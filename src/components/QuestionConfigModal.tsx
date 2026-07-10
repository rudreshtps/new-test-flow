import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import MultiSelect from "./MultiSelect";
import {
  getRuleCodingTotal,
  getRuleMcqTotal,
  getSubtopicLevelAvailability,
  getSubjects,
  QUESTION_LEVELS,
} from "../data/questionBank";
import { DEFAULT_LEVEL_RULES } from "../data/mockData";
import type { QuestionSelectionLogic } from "../types";
import {
  getTotalQuestionTarget,
  summarizeSubtopicRules,
} from "../utils/questionSelection";
import {
  allowsMultiSubjectSelection,
  buildSubtopicRulesFromSelection,
  formatLogicSubjects,
  getDefaultLogicForTest,
  getLogicSubjects,
  getScopeAvailabilityForLogic,
  getSubtopicOptionsForLogic,
  getSubjectsCombinedAvailability,
  getTopicOptionsForLogic,
  getValidSubtopicsForTopics,
  normalizeLogicSubjects,
  resolveRuleSubject,
} from "../utils/selectionLogicHelpers";

type QuestionConfigModalProps = {
  show: boolean;
  scheduleLabel: string;
  batchNames: string[];
  testSubject: string;
  testType: string;
  initialConfig?: { logic: QuestionSelectionLogic; logicSaved?: boolean };
  onHide: () => void;
  onSaveLogic: (logic: QuestionSelectionLogic) => void;
};

function logicEquals(a: QuestionSelectionLogic, b: QuestionSelectionLogic): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clampLogicToAvailability(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean
): QuestionSelectionLogic {
  const normalized = normalizeLogicSubjects(logic, allowMultiSubject);
  return {
    ...normalized,
    subtopicRules: normalized.subtopicRules.map((rule) => {
      const ruleSubject = resolveRuleSubject(rule, normalized);
      return {
        ...rule,
        levelCounts: rule.levelCounts.map((levelRule) => {
          const available = getSubtopicLevelAvailability(
            ruleSubject,
            rule.subtopic,
            levelRule.level
          );
          return {
            ...levelRule,
            mcqCount: Math.min(
              Math.max(0, levelRule.mcqCount),
              available.mcq
            ),
            codingCount: Math.min(
              Math.max(0, levelRule.codingCount),
              available.coding
            ),
          };
        }),
      };
    }),
  };
}

export default function QuestionConfigModal({
  show,
  scheduleLabel,
  batchNames,
  testSubject,
  testType,
  initialConfig,
  onHide,
  onSaveLogic,
}: QuestionConfigModalProps) {
  const allowMultiSubject = allowsMultiSubjectSelection(testType);
  const subjectOptions = getSubjects();

  const [logic, setLogic] = useState<QuestionSelectionLogic>(() =>
    initialConfig?.logic ??
      getDefaultLogicForTest(testSubject, allowMultiSubject)
  );
  const [savedLogic, setSavedLogic] = useState<QuestionSelectionLogic | null>(
    () => (initialConfig?.logicSaved ? initialConfig.logic : null)
  );
  const [logicSaved, setLogicSaved] = useState(
    () => initialConfig?.logicSaved ?? false
  );

  useEffect(() => {
    if (!show) return;
    const baseLogic =
      initialConfig?.logic ??
      getDefaultLogicForTest(testSubject, allowMultiSubject);
    const nextLogic: QuestionSelectionLogic = {
      ...baseLogic,
      subtopicRules:
        baseLogic.subtopicRules?.length > 0
          ? baseLogic.subtopicRules
          : buildSubtopicRulesFromSelection(
              baseLogic,
              allowMultiSubject,
              baseLogic.topics,
              baseLogic.subtopics,
              []
            ),
    };
    setLogic(
      clampLogicToAvailability(
        normalizeLogicSubjects(nextLogic, allowMultiSubject),
        allowMultiSubject
      )
    );
    setSavedLogic(
      initialConfig?.logicSaved
        ? normalizeLogicSubjects(nextLogic, allowMultiSubject)
        : null
    );
    setLogicSaved(initialConfig?.logicSaved ?? false);
  }, [show, initialConfig, testSubject, allowMultiSubject]);

  const selectedSubjects = getLogicSubjects(logic);
  const topicOptions = useMemo(
    () => getTopicOptionsForLogic(logic, allowMultiSubject),
    [logic, allowMultiSubject]
  );
  const subtopicSelectOptions = useMemo(
    () => getSubtopicOptionsForLogic(logic, allowMultiSubject),
    [logic, allowMultiSubject]
  );
  const logicDirty =
    logicSaved && savedLogic ? !logicEquals(logic, savedLogic) : false;

  const scopeAvailability = useMemo(
    () => getScopeAvailabilityForLogic(logic),
    [logic]
  );

  const subjectAvailability = useMemo(
    () =>
      allowMultiSubject
        ? getSubjectsCombinedAvailability(selectedSubjects)
        : getSubjectsCombinedAvailability(
            selectedSubjects.length ? selectedSubjects : [logic.subject]
          ),
    [allowMultiSubject, selectedSubjects, logic.subject]
  );

  const markLogicDirty = (next: QuestionSelectionLogic) => {
    const normalized = clampLogicToAvailability(
      normalizeLogicSubjects(next, allowMultiSubject),
      allowMultiSubject
    );
    setLogic(normalized);
    if (logicSaved && savedLogic && !logicEquals(normalized, savedLogic)) {
      setLogicSaved(false);
    }
  };

  const updateSubtopicLevelCount = (
    subtopic: string,
    subject: string | undefined,
    level: number,
    field: "mcqCount" | "codingCount",
    value: number
  ) => {
    const ruleSubject = subject ?? logic.subject;
    const available = getSubtopicLevelAvailability(
      ruleSubject,
      subtopic,
      level
    );
    const max = field === "mcqCount" ? available.mcq : available.coding;
    const parsed = Number.isFinite(value) ? value : 0;
    const clamped = Math.max(0, Math.min(parsed, max));

    markLogicDirty({
      ...logic,
      subtopicRules: logic.subtopicRules.map((rule) =>
        rule.subtopic === subtopic &&
        (rule.subject ?? logic.subject) === (subject ?? logic.subject)
          ? {
              ...rule,
              levelCounts: rule.levelCounts.map((levelRule) =>
                levelRule.level === level
                  ? { ...levelRule, [field]: clamped }
                  : levelRule
              ),
            }
          : rule
      ),
    });
  };

  const handleSubjectsChange = (subjects: string[]) => {
    markLogicDirty({
      subject: subjects.join(" · "),
      subjects,
      topics: [],
      subtopics: [],
      subtopicRules: [],
    });
    setSavedLogic(null);
    setLogicSaved(false);
  };

  const handleSingleSubjectChange = (subject: string) => {
    markLogicDirty(getDefaultLogicForTest(subject, false));
    setSavedLogic(null);
    setLogicSaved(false);
  };

  const handleTopicsChange = (topics: string[]) => {
    const validSubtopics = getValidSubtopicsForTopics(
      logic,
      allowMultiSubject,
      topics
    );
    const subtopics = logic.subtopics.filter((subtopic) =>
      validSubtopics.includes(subtopic)
    );
    markLogicDirty({
      ...logic,
      topics,
      subtopics,
      subtopicRules: buildSubtopicRulesFromSelection(
        logic,
        allowMultiSubject,
        topics,
        subtopics,
        logic.subtopicRules
      ),
    });
  };

  const handleSubtopicsChange = (subtopics: string[]) => {
    markLogicDirty({
      ...logic,
      subtopics,
      subtopicRules: buildSubtopicRulesFromSelection(
        logic,
        allowMultiSubject,
        logic.topics,
        subtopics,
        logic.subtopicRules
      ),
    });
  };

  const selectAllTopics = () => {
    handleTopicsChange(topicOptions.map((option) => option.value));
  };

  const clearAllTopics = () => {
    handleTopicsChange([]);
  };

  const selectAllSubtopics = () => {
    handleSubtopicsChange(subtopicSelectOptions.map((option) => option.value));
  };

  const clearAllSubtopics = () => {
    handleSubtopicsChange([]);
  };

  const handleSaveLogic = () => {
    const normalized = clampLogicToAvailability(
      normalizeLogicSubjects(logic, allowMultiSubject),
      allowMultiSubject
    );
    if (
      getLogicSubjects(normalized).length === 0 ||
      normalized.topics.length === 0 ||
      getTotalQuestionTarget(normalized) === 0
    ) {
      return;
    }
    setSavedLogic(normalized);
    setLogicSaved(true);
    onSaveLogic(normalized);
  };

  const canSave =
    getLogicSubjects(logic).length > 0 &&
    logic.topics.length > 0 &&
    getTotalQuestionTarget(logic) > 0;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      scrollable
      className="test-flow-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          Selection Logic — {scheduleLabel}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        <div className="bg-light rounded-3 border p-3 mb-3">
          <div className="fw-semibold small mb-1">
            Applies to all schedules · {batchNames.length} batch(es)
          </div>
          <div className="text-muted small">{batchNames.join(" · ")}</div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
            <span className="fw-semibold">Selection Logic</span>
            {logicSaved && !logicDirty && (
              <Badge bg="success" className="fw-normal">
                Logic saved
              </Badge>
            )}
            {logicDirty && (
              <Badge bg="warning" text="dark" className="fw-normal">
                Logic changed — save again
              </Badge>
            )}
          </div>
          <div className="card-body p-3">
            <Row className="g-3 mb-1">
                <Col md={4}>
                  <Form.Group className="mb-0">
                    <div
                      className="d-flex justify-content-between align-items-center mb-1 selection-logic-filter-label"
                    >
                      <Form.Label className="fw-semibold small mb-0">
                        Subject
                      </Form.Label>
                    </div>
                    {allowMultiSubject ? (
                      <MultiSelect
                        options={subjectOptions.map((subject) => ({
                          value: subject,
                          label: subject,
                        }))}
                        value={selectedSubjects}
                        onChange={handleSubjectsChange}
                        placeholder="Select subject(s)"
                      />
                    ) : (
                      <Form.Select
                        value={logic.subject}
                        onChange={(e) => handleSingleSubjectChange(e.target.value)}
                      >
                        {subjectOptions.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-1 selection-logic-filter-label">
                      <Form.Label className="fw-semibold small mb-0">Topics</Form.Label>
                      <div className="d-flex gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-none"
                          onClick={selectAllTopics}
                          disabled={topicOptions.length === 0}
                        >
                          All
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-none text-muted"
                          onClick={clearAllTopics}
                          disabled={topicOptions.length === 0}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <MultiSelect
                      options={topicOptions}
                      value={logic.topics}
                      onChange={handleTopicsChange}
                      placeholder={
                        allowMultiSubject && selectedSubjects.length === 0
                          ? "Select subject(s) first"
                          : "Select topic(s)"
                      }
                      disabled={
                        allowMultiSubject
                          ? selectedSubjects.length === 0
                          : !logic.subject
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-0">
                    <div className="d-flex justify-content-between align-items-center mb-1 selection-logic-filter-label">
                      <Form.Label className="fw-semibold small mb-0">
                        Subtopics
                      </Form.Label>
                    <div className="d-flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none"
                        onClick={selectAllSubtopics}
                        disabled={logic.topics.length === 0}
                      >
                        All
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none text-muted"
                        onClick={clearAllSubtopics}
                        disabled={logic.topics.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <MultiSelect
                    options={subtopicSelectOptions}
                    value={logic.subtopics}
                    onChange={handleSubtopicsChange}
                    placeholder={
                      logic.topics.length === 0
                        ? "Select topics first"
                        : "Select subtopic(s)"
                    }
                    disabled={logic.topics.length === 0}
                  />
                  </Form.Group>
                </Col>
              </Row>

              <div className="mt-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <span className="fw-semibold small text-secondary">
                    Level-wise MCQ &amp; Coding count per subtopic
                  </span>
                  <div className="d-flex flex-wrap gap-2 justify-content-end">
                    <Badge bg="light" text="dark" className="border fw-normal">
                      {formatLogicSubjects(logic)} in DB: {subjectAvailability.mcq}{" "}
                      MCQ · {subjectAvailability.coding} Coding (
                      {subjectAvailability.total} total)
                    </Badge>
                    {logic.subtopicRules.length > 0 && (
                      <Badge bg="info" text="dark" className="fw-normal">
                        Selected scope in DB: {scopeAvailability.mcq} MCQ ·{" "}
                        {scopeAvailability.coding} Coding (
                        {scopeAvailability.total} total)
                      </Badge>
                    )}
                  </div>
                </div>
                {logic.subtopicRules.length === 0 ? (
                  <div className="text-muted small border rounded p-3">
                    {allowMultiSubject && selectedSubjects.length === 0
                      ? "Select one or more subjects, then choose topics to configure question counts per subtopic."
                      : "Select topics to configure question counts per subtopic."}
                  </div>
                ) : (
                  <div className="table-responsive border rounded">
                  <Table
                    size="sm"
                    bordered
                    className="mb-0 align-middle selection-logic-table"
                  >
                    <thead className="table-light">
                      <tr>
                        {allowMultiSubject && (
                          <th rowSpan={2} className="align-middle">
                            Subject
                          </th>
                        )}
                        <th rowSpan={2} className="align-middle">
                          Topic
                        </th>
                        <th rowSpan={2} className="align-middle">
                          Subtopic
                        </th>
                        <th rowSpan={2} className="align-middle">
                          Level
                        </th>
                        <th colSpan={2} className="text-center border-start">
                          MCQ
                        </th>
                        <th colSpan={2} className="text-center border-start">
                          Coding
                        </th>
                      </tr>
                      <tr>
                        <th
                          className="text-center small fw-semibold border-start"
                          style={{ width: 88 }}
                        >
                          Selected
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: 72 }}>
                          Available
                        </th>
                        <th
                          className="text-center small fw-semibold border-start"
                          style={{ width: 88 }}
                        >
                          Selected
                        </th>
                        <th className="text-center small fw-semibold" style={{ width: 72 }}>
                          Available
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logic.subtopicRules.map((rule) => {
                        const ruleSubject = resolveRuleSubject(rule, logic);
                        return QUESTION_LEVELS.map((level, levelIndex) => {
                          const levelMeta = DEFAULT_LEVEL_RULES.find(
                            (item) => item.level === level
                          );
                          const levelRule =
                            rule.levelCounts.find((item) => item.level === level) ?? {
                              level,
                              mcqCount: 0,
                              codingCount: 0,
                            };
                          const available = getSubtopicLevelAvailability(
                            ruleSubject,
                            rule.subtopic,
                            level
                          );
                          return (
                            <tr key={`${ruleSubject}-${rule.subtopic}-L${level}`}>
                              {levelIndex === 0 && (
                                <>
                                  {allowMultiSubject && (
                                    <td
                                      rowSpan={QUESTION_LEVELS.length}
                                      className="small fw-semibold"
                                    >
                                      {ruleSubject}
                                    </td>
                                  )}
                                  <td
                                    rowSpan={QUESTION_LEVELS.length}
                                    className="small"
                                  >
                                    {rule.topic}
                                  </td>
                                  <td
                                    rowSpan={QUESTION_LEVELS.length}
                                    className="fw-semibold small"
                                  >
                                    {rule.subtopic}
                                  </td>
                                </>
                              )}
                              <td className="small text-nowrap">
                                <Badge bg="primary" className="me-1">
                                  L{level}
                                </Badge>
                                <span className="text-muted">
                                  {levelMeta?.label ?? `Level ${level}`}
                                </span>
                              </td>
                              <td className="p-1 text-center">
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min={0}
                                  max={available.mcq}
                                  value={levelRule.mcqCount}
                                  className="text-center mx-auto selection-logic-input"
                                  onChange={(e) =>
                                    updateSubtopicLevelCount(
                                      rule.subtopic,
                                      rule.subject,
                                      level,
                                      "mcqCount",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td className="text-center">
                                <Badge
                                  bg={available.mcq > 0 ? "secondary" : "light"}
                                  text={available.mcq > 0 ? "white" : "dark"}
                                >
                                  {available.mcq}
                                </Badge>
                              </td>
                              <td className="p-1 text-center">
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min={0}
                                  max={available.coding}
                                  value={levelRule.codingCount}
                                  className="text-center mx-auto selection-logic-input"
                                  onChange={(e) =>
                                    updateSubtopicLevelCount(
                                      rule.subtopic,
                                      rule.subject,
                                      level,
                                      "codingCount",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td className="text-center">
                                <Badge
                                  bg={
                                    available.coding > 0 ? "secondary" : "light"
                                  }
                                  text={available.coding > 0 ? "white" : "dark"}
                                >
                                  {available.coding}
                                </Badge>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td
                          colSpan={allowMultiSubject ? 4 : 3}
                          className="fw-semibold small align-middle"
                        >
                          Total to assign
                        </td>
                        <td className="text-center align-middle border-start">
                          <Badge bg="primary">
                            {logic.subtopicRules.reduce(
                              (total, rule) => total + getRuleMcqTotal(rule),
                              0
                            )}
                          </Badge>
                        </td>
                        <td className="text-center align-middle">
                          <Badge bg="secondary">{scopeAvailability.mcq}</Badge>
                        </td>
                        <td className="text-center align-middle border-start">
                          <Badge bg="primary">
                            {logic.subtopicRules.reduce(
                              (total, rule) => total + getRuleCodingTotal(rule),
                              0
                            )}
                          </Badge>
                        </td>
                        <td className="text-center align-middle">
                          <Badge bg="secondary">{scopeAvailability.coding}</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                  </div>
                )}
                <div className="bg-light rounded-3 border small text-muted mt-3 px-3 py-2">
                  <span className="fw-semibold text-dark">Target to assign:</span>{" "}
                  {summarizeSubtopicRules(logic)} ({getTotalQuestionTarget(logic)}{" "}
                  total)
                  <span className="mx-2">·</span>
                  <span className="fw-semibold text-dark">Available in DB</span> for
                  selected scope: {scopeAvailability.mcq} MCQ ·{" "}
                  {scopeAvailability.coding} Coding ({scopeAvailability.total} total)
                </div>
              </div>
            </div>
          </div>
      </Modal.Body>
      <Modal.Footer className="border-top bg-white">
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          disabled={!canSave}
          onClick={() => {
            handleSaveLogic();
            onHide();
          }}
        >
          Save Logic &amp; Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
