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
  buildSubtopicRules,
  getDefaultLogicForSubject,
  getRuleCodingTotal,
  getRuleMcqTotal,
  getScopeAvailability,
  getSubtopicAvailability,
  getSubtopicLevelAvailability,
  getSubjectAvailability,
  getSubtopicsByTopic,
  getSubtopicsForTopics,
  getSubjects,
  getTopicsForSubject,
  QUESTION_LEVELS,
} from "../data/questionBank";
import { DEFAULT_LEVEL_RULES } from "../data/mockData";
import type { QuestionSelectionLogic } from "../types";
import {
  getTotalQuestionTarget,
  summarizeSubtopicRules,
} from "../utils/questionSelection";

type QuestionConfigModalProps = {
  show: boolean;
  scheduleLabel: string;
  batchNames: string[];
  testSubject: string;
  initialConfig?: { logic: QuestionSelectionLogic; logicSaved?: boolean };
  onHide: () => void;
  onSaveLogic: (logic: QuestionSelectionLogic) => void;
};

function logicEquals(a: QuestionSelectionLogic, b: QuestionSelectionLogic): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function QuestionConfigModal({
  show,
  scheduleLabel,
  batchNames,
  testSubject,
  initialConfig,
  onHide,
  onSaveLogic,
}: QuestionConfigModalProps) {
  const subjectOptions = getSubjects();
  const defaultSubject = subjectOptions.includes(testSubject)
    ? testSubject
    : subjectOptions[0] ?? testSubject;

  const [logic, setLogic] = useState<QuestionSelectionLogic>(() =>
    initialConfig?.logic ?? getDefaultLogicForSubject(defaultSubject)
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
      initialConfig?.logic ?? getDefaultLogicForSubject(defaultSubject);
    const nextLogic: QuestionSelectionLogic = {
      ...baseLogic,
      subtopicRules:
        baseLogic.subtopicRules?.length > 0
          ? baseLogic.subtopicRules
          : buildSubtopicRules(
              baseLogic.subject,
              baseLogic.topics,
              baseLogic.subtopics,
              []
            ),
    };
    setLogic(nextLogic);
    setSavedLogic(initialConfig?.logicSaved ? nextLogic : null);
    setLogicSaved(initialConfig?.logicSaved ?? false);
  }, [show, initialConfig, defaultSubject]);

  const topicOptions = getTopicsForSubject(logic.subject);
  const subtopicGroups = getSubtopicsByTopic(logic.subject, logic.topics);
  const logicDirty =
    logicSaved && savedLogic ? !logicEquals(logic, savedLogic) : false;

  const subtopicSelectOptions = useMemo(
    () =>
      subtopicGroups.flatMap((group) =>
        group.subtopics.map((subtopic) => {
          const available = getSubtopicAvailability(logic.subject, subtopic);
          return {
            value: subtopic,
            label: `${group.topic} — ${subtopic} (${available.mcq} MCQ, ${available.coding} Coding in DB)`,
          };
        })
      ),
    [subtopicGroups, logic.subject]
  );

  const scopeAvailability = useMemo(
    () => getScopeAvailability(logic.subject, logic.subtopicRules),
    [logic.subject, logic.subtopicRules]
  );

  const subjectAvailability = useMemo(
    () => getSubjectAvailability(logic.subject),
    [logic.subject]
  );

  const markLogicDirty = (next: QuestionSelectionLogic) => {
    setLogic(next);
    if (logicSaved && savedLogic && !logicEquals(next, savedLogic)) {
      setLogicSaved(false);
    }
  };

  const updateSubtopicLevelCount = (
    subtopic: string,
    level: number,
    field: "mcqCount" | "codingCount",
    value: number
  ) => {
    markLogicDirty({
      ...logic,
      subtopicRules: logic.subtopicRules.map((rule) =>
        rule.subtopic === subtopic
          ? {
              ...rule,
              levelCounts: rule.levelCounts.map((levelRule) =>
                levelRule.level === level
                  ? { ...levelRule, [field]: value }
                  : levelRule
              ),
            }
          : rule
      ),
    });
  };

  const handleTopicsChange = (topics: string[]) => {
    const validSubtopics = getSubtopicsForTopics(logic.subject, topics);
    const subtopics = logic.subtopics.filter((subtopic) =>
      validSubtopics.includes(subtopic)
    );
    markLogicDirty({
      ...logic,
      topics,
      subtopics,
      subtopicRules: buildSubtopicRules(
        logic.subject,
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
      subtopicRules: buildSubtopicRules(
        logic.subject,
        logic.topics,
        subtopics,
        logic.subtopicRules
      ),
    });
  };

  const selectAllTopics = () => {
    handleTopicsChange([...topicOptions]);
  };

  const clearAllTopics = () => {
    handleTopicsChange([]);
  };

  const selectAllSubtopics = () => {
    handleSubtopicsChange(subtopicSelectOptions.map((o) => o.value));
  };

  const clearAllSubtopics = () => {
    handleSubtopicsChange([]);
  };

  const handleSaveLogic = () => {
    if (logic.topics.length === 0 || getTotalQuestionTarget(logic) === 0) return;
    setSavedLogic(logic);
    setLogicSaved(true);
    onSaveLogic(logic);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Selection Logic — {scheduleLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
          <div className="bg-light rounded p-3 mb-3">
            <div className="fw-semibold small mb-1">
              Applies to all schedules · {batchNames.length} batch(es)
            </div>
            <div className="text-muted small">{batchNames.join(" · ")}</div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-semibold small">Selection Logic</span>
              {logicSaved && !logicDirty && (
                <Badge bg="success">Logic saved</Badge>
              )}
              {logicDirty && (
                <Badge bg="warning" text="dark">
                  Logic changed — save again
                </Badge>
              )}
            </div>
            <div className="card-body">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Subject</Form.Label>
                    <Form.Select
                      value={logic.subject}
                      onChange={(e) => {
                        const subject = e.target.value;
                        const defaults = getDefaultLogicForSubject(subject);
                        markLogicDirty(defaults);
                        setSavedLogic(null);
                        setLogicSaved(false);
                      }}
                    >
                      {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-semibold small mb-0">Topics</Form.Label>
                    <div className="d-flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none"
                        onClick={selectAllTopics}
                      >
                        All
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none text-muted"
                        onClick={clearAllTopics}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <MultiSelect
                    options={topicOptions.map((topic) => ({
                      value: topic,
                      label: topic,
                    }))}
                    value={logic.topics}
                    onChange={handleTopicsChange}
                    placeholder="Select topic(s)"
                  />
                  <Form.Text className="text-muted">
                    {logic.topics.length} topic(s) selected
                  </Form.Text>
                </Col>
                <Col md={4}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
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
                  <Form.Text className="text-muted">
                    {logic.subtopics.length} subtopic(s) selected
                    {logic.subtopics.length === 0 &&
                      logic.topics.length > 0 &&
                      " — leave empty to include all subtopics under selected topics"}
                  </Form.Text>
                </Col>
              </Row>

              <div className="mt-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <span className="fw-semibold small">
                    Level-wise MCQ &amp; Coding count per subtopic
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    <Badge bg="light" text="dark" className="border">
                      {logic.subject} in DB: {subjectAvailability.mcq} MCQ ·{" "}
                      {subjectAvailability.coding} Coding (
                      {subjectAvailability.total} total)
                    </Badge>
                    {logic.subtopicRules.length > 0 && (
                      <Badge bg="info" text="dark">
                        Selected scope in DB: {scopeAvailability.mcq} MCQ ·{" "}
                        {scopeAvailability.coding} Coding (
                        {scopeAvailability.total} total)
                      </Badge>
                    )}
                  </div>
                </div>
                {logic.subtopicRules.length === 0 ? (
                  <div className="text-muted small border rounded p-3">
                    Select topics to configure question counts per subtopic.
                  </div>
                ) : (
                  <Table size="sm" bordered responsive className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th rowSpan={2}>Topic</th>
                        <th rowSpan={2}>Subtopic</th>
                        <th rowSpan={2}>Level</th>
                        <th colSpan={2} className="text-center">
                          MCQ
                        </th>
                        <th colSpan={2} className="text-center">
                          Coding
                        </th>
                      </tr>
                      <tr>
                        <th className="text-center" style={{ width: 72 }}>
                          Set
                        </th>
                        <th className="text-center" style={{ width: 56 }}>
                          In DB
                        </th>
                        <th className="text-center" style={{ width: 72 }}>
                          Set
                        </th>
                        <th className="text-center" style={{ width: 56 }}>
                          In DB
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logic.subtopicRules.map((rule) =>
                        QUESTION_LEVELS.map((level, levelIndex) => {
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
                            logic.subject,
                            rule.subtopic,
                            level
                          );
                          return (
                            <tr key={`${rule.subtopic}-L${level}`}>
                              {levelIndex === 0 && (
                                <>
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
                              <td>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min={0}
                                  max={available.mcq}
                                  value={levelRule.mcqCount}
                                  onChange={(e) =>
                                    updateSubtopicLevelCount(
                                      rule.subtopic,
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
                              <td>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min={0}
                                  max={available.coding}
                                  value={levelRule.codingCount}
                                  onChange={(e) =>
                                    updateSubtopicLevelCount(
                                      rule.subtopic,
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
                        })
                      )}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan={3} className="fw-semibold small">
                          Total to assign
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">
                            {logic.subtopicRules.reduce(
                              (total, rule) => total + getRuleMcqTotal(rule),
                              0
                            )}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="secondary">{scopeAvailability.mcq}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">
                            {logic.subtopicRules.reduce(
                              (total, rule) => total + getRuleCodingTotal(rule),
                              0
                            )}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="secondary">{scopeAvailability.coding}</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                )}
                <div className="text-muted small mt-2">
                  Target to assign: {summarizeSubtopicRules(logic)} (
                  {getTotalQuestionTarget(logic)} total) · Available in DB for
                  selected scope: {scopeAvailability.mcq} MCQ ·{" "}
                  {scopeAvailability.coding} Coding ({scopeAvailability.total}{" "}
                  total)
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={
                    logic.topics.length === 0 ||
                    getTotalQuestionTarget(logic) === 0
                  }
                  onClick={handleSaveLogic}
                >
                  Save Logic
                </Button>
              </div>
            </div>
          </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          disabled={
            logic.topics.length === 0 || getTotalQuestionTarget(logic) === 0
          }
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
