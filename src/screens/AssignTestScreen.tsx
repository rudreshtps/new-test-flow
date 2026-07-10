import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { BiSolidEdit } from "react-icons/bi";
import {
  BsCalendar3,
  BsChevronDown,
  BsChevronUp,
  BsClock,
  BsJournalText,
  BsPeople,
  BsShieldCheck,
  BsShuffle,
} from "react-icons/bs";
import { GiStarShuriken } from "react-icons/gi";
import { LuPlus } from "react-icons/lu";
import { VscListFlat } from "react-icons/vsc";
import TestFilterSelect from "../components/TestFilterSelect";
import GeneratedQuestionsReviewModal from "../components/GeneratedQuestionsReviewModal";
import QuestionConfigModal from "../components/QuestionConfigModal";
import TestPageShell from "../components/TestPageShell";
import {
  BATCHES_BY_COURSE_ID,
  COURSES_BY_TRACK_ID,
  TRACK_OPTIONS,
  formatAssignDate,
  formatAssignTime,
  getInitialAssignedIds,
  getEligibleStudentsForAssign,
  getStudentAssignBlockReason,
  getStudentsForBatch,
  getTestById,
  type BatchAssignStatus,
  type BatchStudent,
  type TestBatchAssignment,
} from "../constants/assignTestConstants";
import {
  DEFAULT_LEVEL_RULES,
  getQuestionSetForTime,
} from "../data/mockData";
import type { QuestionSelectionLogic, ScheduleSlotState, SlotAssignStatus } from "../types";
import { generateQuestionsFromLogic } from "../utils/questionSelection";
import {
  computeDurationFromLevelRules,
  computeDurationFromSelectionLogic,
} from "../utils/testDuration";
import {
  buildSubjectLevelLogic,
  generateQuestionsFromLevelRules,
} from "../utils/sftGeneration";
import { formatLogicSubjects } from "../utils/selectionLogicHelpers";

const statusDotStyle = (status: BatchAssignStatus): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  display: "inline-block",
  backgroundColor:
    status === "scheduled"
      ? "#198754"
      : status === "partial"
        ? "#ffc107"
        : "#adb5bd",
});

const iconButtonStyle: React.CSSProperties = { width: 30, height: 30 };

function scheduleKey(batch: TestBatchAssignment): string {
  if (!batch.date || !batch.time) return `unset-${batch.batch_id}`;
  return `${batch.date}|${batch.time}`;
}

function BatchRow({
  batch,
  onAssignStudents,
  onRemove,
}: {
  batch: TestBatchAssignment;
  onAssignStudents: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="d-flex justify-content-between align-items-center gap-2 py-2 px-2 border-bottom">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span style={statusDotStyle(batch.status)} title={batch.status} />
        <span className="fw-semibold">{batch.batch_name}</span>
        <Badge bg="light" text="dark" className="border">
          {batch.course_name}
        </Badge>
        {batch.test_type && <Badge bg="secondary">{batch.test_type}</Badge>}
        {batch.studentCount > 0 && (
          <Badge bg="info" text="dark">
            {batch.studentCount} students
          </Badge>
        )}
      </div>
      <div className="d-flex gap-1 flex-shrink-0">
        <Button
          variant={batch.studentCount > 0 ? "success" : "outline-primary"}
          size="sm"
          className="p-0 d-inline-flex align-items-center justify-content-center"
          style={iconButtonStyle}
          title="Assign students"
          onClick={onAssignStudents}
        >
          <BsPeople />
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          className="p-0 d-inline-flex align-items-center justify-content-center"
          style={iconButtonStyle}
          title="Remove batch"
          onClick={onRemove}
        >
          ×
        </Button>
      </div>
    </div>
  );
}

type ScheduleGroupBoxProps = {
  date: string | null;
  time: string | null;
  batches: TestBatchAssignment[];
  questionSetName: string;
  questionSetSlot: string;
  questionCount: number;
  testLogicSaved: boolean;
  questionsGenerated: boolean;
  questionsConfirmed: boolean;
  isSubjectFinalTest?: boolean;
  subjectCompleted?: boolean;
  assignStatus?: SlotAssignStatus;
  canAssignTest?: boolean;
  canTriggerTest?: boolean;
  onAssignTest?: () => void;
  onTriggerTest?: () => void;
  onAssignStudents: (batch: TestBatchAssignment) => void;
  onOpenSchedule: () => void;
  onOpenSecurity: () => void;
  onGenerateQuestions: () => void;
  onReviewQuestions: () => void;
  onRemove: (batchId: string) => void;
};

function ScheduleGroupBox({
  date,
  time,
  batches,
  questionSetName,
  questionSetSlot,
  questionCount,
  testLogicSaved,
  questionsGenerated,
  questionsConfirmed,
  isSubjectFinalTest = false,
  subjectCompleted = true,
  assignStatus = "draft",
  canAssignTest = false,
  canTriggerTest = false,
  onAssignTest,
  onTriggerTest,
  onAssignStudents,
  onOpenSchedule,
  onOpenSecurity,
  onGenerateQuestions,
  onReviewQuestions,
  onRemove,
}: ScheduleGroupBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const batchListRef = useRef<HTMLDivElement>(null);
  const isScheduled = Boolean(date && time);
  const multiSameTime = isScheduled && batches.length > 1;
  const totalStudents = batches.reduce((n, b) => n + b.studentCount, 0);
  const allSecuritySaved = batches.every((b) => b.securitySaved);
  const allScheduleSaved = batches.every((b) => b.scheduleSaved);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  useEffect(() => {
    if (expanded && batchListRef.current) {
      batchListRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [expanded]);

  return (
    <div className="border rounded bg-white mb-3 shadow-sm">
      <div className="px-3 py-2 bg-light border-bottom">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <button
            type="button"
            className="flex-grow-1 border-0 bg-transparent text-start p-0"
            onClick={toggleExpanded}
            aria-expanded={expanded}
          >
            <div className="d-flex align-items-start gap-2">
              <span className="text-secondary mt-1">
                {expanded ? <BsChevronUp /> : <BsChevronDown />}
              </span>
              <div>
                <div className="fw-semibold text-dark">
                  {multiSameTime
                    ? "Same schedule · shared questions"
                    : isScheduled
                      ? "Scheduled slot"
                      : "Not scheduled"}
                </div>
                <div className="d-flex flex-wrap align-items-center gap-3 text-secondary small mt-1">
                  <span className="d-inline-flex align-items-center gap-1">
                    <BsCalendar3 />
                    {date ? formatAssignDate(date) : "Not Set"}
                  </span>
                  <span className="d-inline-flex align-items-center gap-1">
                    <BsClock />
                    {time ? formatAssignTime(time) : "Not Set"}
                  </span>
                  {(isScheduled || questionsConfirmed) && (
                    <span>
                      Question set: <strong>{questionSetName}</strong>
                      {!questionsConfirmed && questionSetSlot !== "—" && (
                        <> ({questionSetSlot})</>
                      )}
                      {questionsConfirmed && (
                        <span className="text-success ms-1">· confirmed</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
          <div className="d-flex flex-wrap align-items-center gap-2 flex-shrink-0">
            <div className="d-flex gap-1">
              <Button
                variant={
                  questionsGenerated && !questionsConfirmed
                    ? "primary"
                    : testLogicSaved
                      ? "outline-primary"
                      : "outline-secondary"
                }
                size="sm"
                className="p-0 d-inline-flex align-items-center justify-content-center"
                style={iconButtonStyle}
                title={
                  isSubjectFinalTest
                    ? "Generate questions from level rules"
                    : testLogicSaved
                      ? "Generate questions from saved logic"
                      : "Save selection logic at test level first"
                }
                disabled={
                  isSubjectFinalTest ? !subjectCompleted : !testLogicSaved
                }
                onClick={onGenerateQuestions}
              >
                <BsShuffle />
              </Button>
              <Button
                variant={allSecuritySaved ? "success" : "outline-secondary"}
                size="sm"
                className="p-0 d-inline-flex align-items-center justify-content-center"
                style={iconButtonStyle}
                title={
                  batches.length > 1
                    ? "Report release settings (all batches in this slot)"
                    : "Report release settings"
                }
                onClick={onOpenSecurity}
              >
                <BsShieldCheck />
              </Button>
              <Button
                variant={allScheduleSaved ? "success" : "outline-secondary"}
                size="sm"
                className="p-0 d-inline-flex align-items-center justify-content-center"
                style={iconButtonStyle}
                title={
                  batches.length > 1
                    ? "Schedule test (all batches in this slot)"
                    : "Schedule test"
                }
                onClick={onOpenSchedule}
              >
                <BsClock />
              </Button>
            </div>
            <Badge bg="primary">{batches.length} batch(es)</Badge>
            {totalStudents > 0 && (
              <Badge bg="info" text="dark">
                {totalStudents} students
              </Badge>
            )}
            {(multiSameTime || questionsConfirmed || questionsGenerated) &&
              questionCount > 0 && (
              <Badge
                bg="success"
                role={questionsGenerated ? "button" : undefined}
                style={questionsGenerated ? { cursor: "pointer" } : undefined}
                onClick={questionsGenerated ? onReviewQuestions : undefined}
                title={questionsGenerated ? "Review generated questions" : undefined}
              >
                {questionCount} Q shared
              </Badge>
            )}
            {isSubjectFinalTest && (
              <>
                <Button
                  variant={assignStatus === "assigned" || assignStatus === "live" || assignStatus === "completed" ? "success" : "primary"}
                  size="sm"
                  disabled={!canAssignTest || assignStatus === "live" || assignStatus === "completed"}
                  onClick={onAssignTest}
                  title="Assign test to batches (schedule + question set)"
                >
                  Assign
                </Button>
                <Button
                  variant={assignStatus === "live" ? "danger" : "outline-danger"}
                  size="sm"
                  disabled={!canTriggerTest || assignStatus === "live" || assignStatus === "completed"}
                  onClick={onTriggerTest}
                  title="Start test when students are ready"
                >
                  Trigger
                </Button>
                {assignStatus !== "draft" && (
                  <Badge
                    bg={
                      assignStatus === "live"
                        ? "danger"
                        : assignStatus === "completed"
                          ? "secondary"
                          : "warning"
                    }
                    text={assignStatus === "assigned" ? "dark" : undefined}
                  >
                    {assignStatus === "assigned"
                      ? "Assigned"
                      : assignStatus === "live"
                        ? "Live"
                        : "Completed"}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div ref={batchListRef} className="px-2 pt-1 pb-1">
          <div className="small fw-semibold text-secondary px-2 pt-1 pb-1">
            Assigned batches
          </div>
          {batches.map((batch) => (
            <BatchRow
              key={batch.batch_id}
              batch={batch}
              onAssignStudents={() => onAssignStudents(batch)}
              onRemove={() => onRemove(batch.batch_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type StudentsManageModalProps = {
  show: boolean;
  batch: TestBatchAssignment | null;
  assignedIds: string[];
  isSubjectFinalTest?: boolean;
  testSubject?: string;
  onHide: () => void;
  onAdd: (studentId: string) => void;
  onRemove: (studentId: string) => void;
  onAddAll: () => void;
  onRemoveAll: () => void;
  onSave: () => void;
};

function StudentsManageModal({
  show,
  batch,
  assignedIds,
  isSubjectFinalTest = false,
  testSubject = "",
  onHide,
  onAdd,
  onRemove,
  onAddAll,
  onRemoveAll,
  onSave,
}: StudentsManageModalProps) {
  if (!batch) return null;

  const pool = getStudentsForBatch(batch.batch_name);
  const eligible = getEligibleStudentsForAssign(
    batch.batch_name,
    testSubject,
    isSubjectFinalTest
  );
  const eligibleIds = new Set(eligible.map((s) => s.id));
  const available = pool.filter(
    (s) => !assignedIds.includes(s.id) && eligibleIds.has(s.id)
  );
  const assigned = pool.filter((s) => assignedIds.includes(s.id));
  const blocked = pool.filter(
    (s) =>
      !assignedIds.includes(s.id) &&
      isSubjectFinalTest &&
      !eligibleIds.has(s.id)
  );
  const removableCount = assigned.filter((s) => !s.testTaken).length;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Manage Students — {batch.batch_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-light rounded p-3 mb-3">
          <div className="fw-semibold">{batch.batch_name}</div>
          <div className="text-muted small">
            {batch.course_name} · {assigned.length} student(s) assigned
          </div>
        </div>

        {pool.length === 0 ? (
          <Alert variant="warning" className="mb-0">
            No students found for this batch in the mock data.
          </Alert>
        ) : (
          <>
            {isSubjectFinalTest && blocked.length > 0 && (
              <Alert variant="warning" className="py-2 small">
                {blocked.length} student(s) cannot be assigned (absent or already
                completed final test for {testSubject}).
              </Alert>
            )}
          <Row className="g-3">
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
                <span className="fw-semibold small">
                  Available ({available.length})
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={available.length === 0}
                  onClick={onAddAll}
                >
                  Add all
                </Button>
              </div>
              <div className="border rounded" style={{ maxHeight: 280, overflowY: "auto" }}>
                <Table size="sm" hover className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Student</th>
                      <th className="text-end" style={{ width: 72 }}>
                        Add
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {available.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-muted small text-center py-3">
                          All students are assigned
                        </td>
                      </tr>
                    ) : (
                      available.map((student) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          actionLabel="+"
                          actionVariant="outline-primary"
                          onAction={() => onAdd(student.id)}
                        />
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
                <span className="fw-semibold small">
                  Assigned ({assigned.length})
                </span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  disabled={removableCount === 0}
                  onClick={onRemoveAll}
                  title={
                    removableCount === 0 && assigned.length > 0
                      ? "Cannot remove students who already took the test"
                      : undefined
                  }
                >
                  Remove all
                </Button>
              </div>
              <div className="border rounded" style={{ maxHeight: 280, overflowY: "auto" }}>
                <Table size="sm" hover className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Student</th>
                      <th className="text-end" style={{ width: 72 }}>
                        Remove
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigned.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-muted small text-center py-3">
                          No students assigned yet
                        </td>
                      </tr>
                    ) : (
                      assigned.map((student) => {
                        const blockReason = getStudentAssignBlockReason(
                          student,
                          testSubject,
                          isSubjectFinalTest
                        );
                        return (
                        <StudentRow
                          key={student.id}
                          student={student}
                          actionLabel="−"
                          actionVariant="outline-danger"
                          onAction={() => onRemove(student.id)}
                          disabled={student.testTaken}
                          disabledTitle="Cannot remove — test already taken"
                          blockReason={blockReason}
                        />
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave}>
          Save ({assigned.length} students)
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function StudentRow({
  student,
  actionLabel,
  actionVariant,
  onAction,
  disabled,
  disabledTitle,
  blockReason,
}: {
  student: BatchStudent;
  actionLabel: string;
  actionVariant: string;
  onAction: () => void;
  disabled?: boolean;
  disabledTitle?: string;
  blockReason?: string | null;
}) {
  return (
    <tr>
      <td>
        <div className="fw-semibold small">{student.name}</div>
        <div className="text-muted" style={{ fontSize: "0.7rem" }}>
          {student.id} · {student.college} · {student.branch}
        </div>
        {blockReason && (
          <div className="text-danger" style={{ fontSize: "0.65rem" }}>
            {blockReason}
          </div>
        )}
      </td>
      <td className="text-end align-middle">
        <Button
          variant={actionVariant}
          size="sm"
          className="px-2 py-0"
          onClick={onAction}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
        >
          {actionLabel}
        </Button>
      </td>
    </tr>
  );
}

const AssignTestDetail = () => {
  const { testId } = useParams<{ testId?: string }>();
  const navigate = useNavigate();
  const test = getTestById(testId ?? "");

  const [batchConfigs, setBatchConfigs] = useState<TestBatchAssignment[]>(
    () => test?.batches ?? []
  );
  const [selectedTrack, setSelectedTrack] = useState("it");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showGeneratedQuestionsModal, setShowGeneratedQuestionsModal] =
    useState(false);
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
  const [activeScheduleKey, setActiveScheduleKey] = useState<string | null>(null);
  const [testQuestionLogic, setTestQuestionLogic] =
    useState<QuestionSelectionLogic | null>(() => test?.selectionLogic ?? null);
  const [testLogicSaved, setTestLogicSaved] = useState(
    () => test?.selectionLogicSaved ?? false
  );
  const [groupQuestionSets, setGroupQuestionSets] = useState<
    Record<string, ScheduleSlotState>
  >({});
  const [actionAlert, setActionAlert] = useState<{
    variant: "success" | "warning" | "info";
    message: string;
  } | null>(null);
  const [draftAssignedIds, setDraftAssignedIds] = useState<string[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeGroupBatchIds, setActiveGroupBatchIds] = useState<string[]>([]);
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [autoRelease, setAutoRelease] = useState(true);

  useEffect(() => {
    setBatchConfigs(test?.batches ? [...test.batches] : []);
    setTestQuestionLogic(test?.selectionLogic ?? null);
    setTestLogicSaved(test?.selectionLogicSaved ?? false);
  }, [testId, test]);

  const courseOptions = COURSES_BY_TRACK_ID[selectedTrack] ?? [];
  const batchOptions = BATCHES_BY_COURSE_ID[selectedCourse] ?? [];
  const activeBatch = batchConfigs.find((b) => b.batch_id === activeBatchId);
  const activeGroupBatches = batchConfigs.filter((b) =>
    activeGroupBatchIds.includes(b.batch_id)
  );
  const isSubjectFinalTest = test?.type === "Subject Final Test";
  const subjectCompleted = test?.subjectCompleted ?? !isSubjectFinalTest;
  const sftLevelLogic = useMemo(
    () => (test ? buildSubjectLevelLogic(test.subject) : null),
    [test]
  );

  const displayDuration = useMemo(() => {
    if (isSubjectFinalTest && subjectCompleted) {
      return computeDurationFromLevelRules(DEFAULT_LEVEL_RULES);
    }
    if (testLogicSaved && testQuestionLogic) {
      const minutes = computeDurationFromSelectionLogic(testQuestionLogic);
      return minutes > 0 ? minutes : null;
    }
    return null;
  }, [
    isSubjectFinalTest,
    subjectCompleted,
    testLogicSaved,
    testQuestionLogic,
  ]);

  const emptySlotState = (): ScheduleSlotState => ({
    questionIds: [],
    confirmed: false,
    assignStatus: "draft",
    triggeredAt: null,
    triggeredTime: null,
  });

  /** Batches with the same date+time share one question set → grouped in one box */
  const scheduleGroups = useMemo(() => {
    const map = new Map<
      string,
      { date: string | null; time: string | null; batches: TestBatchAssignment[] }
    >();
    const orderedKeys: string[] = [];

    batchConfigs.forEach((batch) => {
      const key = scheduleKey(batch);
      if (!map.has(key)) {
        orderedKeys.push(key);
        map.set(key, {
          date: batch.date,
          time: batch.time,
          batches: [],
        });
      }
      map.get(key)!.batches.push(batch);
    });

    return orderedKeys.map((key) => {
      const group = map.get(key)!;
      const set = group.time
        ? getQuestionSetForTime(group.time)
        : null;
      return { key, ...group, questionSet: set };
    });
  }, [batchConfigs]);

  const activeScheduleGroup = scheduleGroups.find(
    (group) => group.key === activeScheduleKey
  );

  if (!test) {
    return (
      <div className="p-4">
        <Alert variant="warning">
          Test not found.{" "}
          <Link to="/assign-test">Back to test list</Link>
        </Alert>
      </div>
    );
  }

  const handleAddBatch = () => {
    if (!selectedTrack || !selectedCourse || !selectedBatch) {
      return;
    }
    if (batchConfigs.some((b) => b.batch_id === selectedBatch)) {
      return;
    }
    const track = TRACK_OPTIONS.find((t) => t.id === selectedTrack);
    const course = courseOptions.find((c) => c.id === selectedCourse);
    const batch = batchOptions.find((b) => b.id === selectedBatch);
    if (!track || !course || !batch) return;

    setBatchConfigs((prev) => [
      ...prev,
      {
        batch_id: batch.id,
        batch_name: batch.name,
        course_id: course.id,
        course_name: course.name,
        track_id: track.id,
        track_name: track.name,
        status: "draft",
        test_type: null,
        date: null,
        time: null,
        studentCount: 0,
        securitySaved: false,
        scheduleSaved: false,
      },
    ]);
    setSelectedBatch("");
  };

  const handleRemoveBatch = (batchId: string) => {
    setBatchConfigs((prev) => prev.filter((b) => b.batch_id !== batchId));
  };

  const openScheduleForGroup = (batches: TestBatchAssignment[]) => {
    const first = batches[0];
    if (!first) return;
    setActiveGroupBatchIds(batches.map((b) => b.batch_id));
    setDraftDate(first.date ?? "");
    setDraftTime(first.time ?? "");
    setShowScheduleModal(true);
  };

  const saveSchedule = () => {
    if (!draftDate || !draftTime) return;
    if (activeGroupBatchIds.length === 0) return;
    setBatchConfigs((prev) =>
      prev.map((b) =>
        activeGroupBatchIds.includes(b.batch_id)
          ? {
              ...b,
              date: draftDate,
              time: draftTime,
              test_type: b.test_type ?? test.type,
              status: b.studentCount > 0 ? "scheduled" : "draft",
              scheduleSaved: true,
            }
          : b
      )
    );
    setShowScheduleModal(false);
  };

  const openSecurityForGroup = (batches: TestBatchAssignment[]) => {
    if (batches.length === 0) return;
    setActiveGroupBatchIds(batches.map((b) => b.batch_id));
    setAutoRelease(true);
    setShowSecurityModal(true);
  };

  const saveSecurity = () => {
    if (activeGroupBatchIds.length === 0) return;
    setBatchConfigs((prev) =>
      prev.map((b) =>
        activeGroupBatchIds.includes(b.batch_id)
          ? { ...b, securitySaved: true }
          : b
      )
    );
    setShowSecurityModal(false);
  };

  const openStudents = (batch: TestBatchAssignment) => {
    setActiveBatchId(batch.batch_id);
    setDraftAssignedIds(getInitialAssignedIds(batch));
    setShowStudentsModal(true);
  };

  const saveStudents = () => {
    if (!activeBatchId) return;
    setBatchConfigs((prev) =>
      prev.map((b) => {
        if (b.batch_id !== activeBatchId) return b;
        const count = draftAssignedIds.length;
        return {
          ...b,
          assignedStudentIds: [...draftAssignedIds],
          studentCount: count,
          status:
            count > 0 && b.scheduleSaved && b.date
              ? "scheduled"
              : count > 0
                ? "partial"
                : "draft",
        };
      })
    );
    setShowStudentsModal(false);
  };

  const openQuestionLogic = () => {
    setShowQuestionsModal(true);
  };

  const openReviewForGroup = (groupKey: string) => {
    setActiveScheduleKey(groupKey);
    setShowGeneratedQuestionsModal(true);
  };

  const generateQuestionsForGroup = (groupKey: string) => {
    if (isSubjectFinalTest) {
      if (!subjectCompleted) return;
      const result = generateQuestionsFromLevelRules(
        test.subject,
        DEFAULT_LEVEL_RULES
      );
      setGroupQuestionSets((prev) => ({
        ...prev,
        [groupKey]: {
          ...(prev[groupKey] ?? emptySlotState()),
          questionIds: result.questionIds,
          confirmed: false,
          assignStatus: "draft",
        },
      }));
      setGenerationWarnings(result.warnings);
      setActiveScheduleKey(groupKey);
      setShowGeneratedQuestionsModal(true);
      return;
    }

    if (!testLogicSaved || !testQuestionLogic) {
      return;
    }
    const result = generateQuestionsFromLogic(testQuestionLogic);
    setGroupQuestionSets((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] ?? emptySlotState()),
        questionIds: result.questionIds,
        confirmed: false,
        assignStatus: "draft",
      },
    }));
    setGenerationWarnings(result.warnings);
    setActiveScheduleKey(groupKey);
    setShowGeneratedQuestionsModal(true);
  };

  const saveQuestionLogic = (logic: QuestionSelectionLogic) => {
    setTestQuestionLogic(logic);
    setTestLogicSaved(true);
    setGroupQuestionSets({});
  };

  const assignTestToGroup = (groupKey: string) => {
    const group = scheduleGroups.find((g) => g.key === groupKey);
    const slot = groupQuestionSets[groupKey];
    if (!group || !slot?.confirmed) return;
    const ready =
      group.batches.every((b) => b.scheduleSaved && b.studentCount > 0) &&
      slot.questionIds.length > 0;
    if (!ready) return;

    setGroupQuestionSets((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] ?? emptySlotState()),
        assignStatus: "assigned",
      },
    }));
    setActionAlert({
      variant: "success",
      message: `Test assigned for ${group.batches.length} batch(es). Use Trigger when students are ready.`,
    });
  };

  const triggerTestForGroup = (groupKey: string) => {
    const slot = groupQuestionSets[groupKey];
    if (slot?.assignStatus !== "assigned") return;

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    setGroupQuestionSets((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] ?? emptySlotState()),
        assignStatus: "live",
        triggeredAt: date,
        triggeredTime: time,
      },
    }));
    setActionAlert({
      variant: "info",
      message: `Test triggered at ${time}. Students can now begin.`,
    });
  };

  const canAssignGroup = (groupKey: string) => {
    const group = scheduleGroups.find((g) => g.key === groupKey);
    const slot = groupQuestionSets[groupKey];
    if (!group || !slot?.confirmed || slot.assignStatus !== "draft") {
      return false;
    }
    return (
      group.batches.length > 0 &&
      group.batches.every((b) => b.scheduleSaved && b.studentCount > 0) &&
      slot.questionIds.length > 0
    );
  };

  const canTriggerGroup = (groupKey: string) =>
    groupQuestionSets[groupKey]?.assignStatus === "assigned";

  const saveQuestionConfig = (
    questionIds: string[],
    groupKey: string = activeScheduleKey ?? ""
  ) => {
    if (!groupKey) return;
    setGroupQuestionSets((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] ?? emptySlotState()),
        questionIds,
        confirmed: true,
        assignStatus: prev[groupKey]?.assignStatus ?? "draft",
      },
    }));
    setShowGeneratedQuestionsModal(false);
  };

  const getGroupQuestionMeta = (groupKey: string, fallbackCount: number) => {
    const groupSet = groupQuestionSets[groupKey];
    const subject = testQuestionLogic?.subject ?? test.subject;

    if (groupSet?.confirmed) {
      return {
        questionCount: groupSet.questionIds.length,
        questionSetName: isSubjectFinalTest
          ? `Level rules · ${subject}`
          : `Level-based · ${subject}`,
        questionsGenerated: groupSet.questionIds.length > 0,
        questionsConfirmed: true,
        assignStatus: groupSet.assignStatus,
      };
    }
    if (groupSet && groupSet.questionIds.length > 0) {
      return {
        questionCount: groupSet.questionIds.length,
        questionSetName: isSubjectFinalTest
          ? `Level rules · ${subject}`
          : `Level-based · ${subject}`,
        questionsGenerated: true,
        questionsConfirmed: false,
        assignStatus: groupSet.assignStatus,
      };
    }
    if (testLogicSaved && !isSubjectFinalTest) {
      return {
        questionCount: fallbackCount,
        questionSetName: `Logic saved · ${subject}`,
        questionsGenerated: false,
        questionsConfirmed: false,
        assignStatus: groupSet?.assignStatus ?? "draft",
      };
    }
    if (isSubjectFinalTest && subjectCompleted) {
      return {
        questionCount: fallbackCount,
        questionSetName: `Level rules · ${subject}`,
        questionsGenerated: false,
        questionsConfirmed: false,
        assignStatus: groupSet?.assignStatus ?? "draft",
      };
    }
    return {
      questionCount: fallbackCount,
      questionSetName: undefined as string | undefined,
      questionsGenerated: false,
      questionsConfirmed: false,
      assignStatus: groupSet?.assignStatus ?? "draft",
    };
  };

  return (
    <div className="d-flex flex-column pb-2 gap-2">
      <div className="d-flex align-items-center justify-content-end flex-wrap gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate("/assign-test")}
        >
          ← Back to Test List
        </Button>
      </div>

      {actionAlert && (
        <Alert
          variant={actionAlert.variant}
          dismissible
          onClose={() => setActionAlert(null)}
        >
          {actionAlert.message}
        </Alert>
      )}

      {/* Test header — same as configure detail */}
      <div className="border-bottom pb-3 mb-1">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-semibold">{test.name}</h5>
              {!isSubjectFinalTest && (
                <Button
                  variant="link"
                  className="p-0 text-secondary"
                  aria-label="Edit test"
                >
                  <BiSolidEdit size={20} />
                </Button>
              )}
              {isSubjectFinalTest && (
                <Badge bg="secondary">System name · not editable</Badge>
              )}
            </div>
            <div className="d-flex flex-wrap gap-3 mt-2 text-secondary small">
              <span className="d-inline-flex align-items-center gap-1">
                <VscListFlat />
                {test.subject}
              </span>
              {displayDuration != null && (
                <span className="d-inline-flex align-items-center gap-1">
                  <BsClock />
                  {displayDuration} Minutes
                </span>
              )}
              <span className="d-inline-flex align-items-center gap-1">
                <GiStarShuriken />
                {test.marks} Marks
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2">
          <span className="fw-semibold small">Description:</span>
          <div className="text-muted small">{test.description || "—"}</div>
        </div>

        {isSubjectFinalTest && !subjectCompleted && (
          <Alert variant="warning" className="mt-3 mb-0 py-2 small">
            Assign is disabled until the subject is marked complete in the course.
          </Alert>
        )}

        {!isSubjectFinalTest && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-2 border-top">
          <span className="small fw-semibold text-secondary">Selection logic</span>
          <Button
            variant={
              testLogicSaved
                ? "success"
                : "outline-primary"
            }
            size="sm"
            className="p-0 d-inline-flex align-items-center justify-content-center"
            style={iconButtonStyle}
            title={
              testLogicSaved
                ? "Selection logic (saved for all schedules)"
                : "Configure selection logic"
            }
            onClick={openQuestionLogic}
          >
            <BsJournalText />
          </Button>
          {testLogicSaved && testQuestionLogic && (
            <Badge bg="success">
              Saved · {formatLogicSubjects(testQuestionLogic)}
            </Badge>
          )}
          {scheduleGroups.length > 1 && (
            <span className="text-muted small">
              Shared across {scheduleGroups.length} schedule slot(s)
            </span>
          )}
        </div>
        )}
      </div>

      {/* Add batch row */}
      <Row className="g-2 align-items-end mb-2">
        <Col md={3}>
          <TestFilterSelect
            label="Track"
            value={selectedTrack}
            onChange={(value) => {
              setSelectedTrack(value);
              setSelectedCourse("");
              setSelectedBatch("");
            }}
            placeholder="Select Track"
            options={TRACK_OPTIONS.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            fullWidth
          />
        </Col>
        <Col md={4}>
          <TestFilterSelect
            label="Course"
            value={selectedCourse}
            onChange={(value) => {
              setSelectedCourse(value);
              setSelectedBatch("");
            }}
            disabled={!selectedTrack}
            placeholder="Select Course"
            options={courseOptions.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            fullWidth
          />
        </Col>
        <Col md={3}>
          <TestFilterSelect
            label="Batch"
            value={selectedBatch}
            onChange={setSelectedBatch}
            disabled={!selectedCourse}
            placeholder="Select Batch"
            options={batchOptions
              .filter(
                (b) => !batchConfigs.some((cfg) => cfg.batch_id === b.id)
              )
              .map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            fullWidth
          />
        </Col>
        <Col md={2}>
          <Button
            variant="primary"
            size="sm"
            className="w-100 d-inline-flex align-items-center justify-content-center gap-1"
            onClick={handleAddBatch}
            disabled={isSubjectFinalTest && !subjectCompleted}
            title={
              isSubjectFinalTest && !subjectCompleted
                ? "Subject must be completed first"
                : undefined
            }
          >
            <LuPlus /> Add Batch
          </Button>
        </Col>
      </Row>

      {/* Batch list — same date+time → one shared question-set box */}
      <div className="fw-semibold small text-secondary mb-1">
        Batches for this test ({batchConfigs.length})
      </div>
      {batchConfigs.length === 0 ? (
        <div className="border rounded bg-light p-4 text-center text-muted small mb-3">
          No batches assigned yet. Select Track → Course → Batch and click{" "}
          <strong>Add Batch</strong>.
        </div>
      ) : (
        scheduleGroups.map((group) => {
          const meta = getGroupQuestionMeta(
            group.key,
            group.questionSet?.questions.length ?? 0
          );
          return (
            <ScheduleGroupBox
              key={group.key}
              date={group.date}
              time={group.time}
              batches={group.batches}
              questionSetName={
                meta.questionSetName ?? group.questionSet?.name ?? "Not configured"
              }
              questionSetSlot={group.questionSet?.timeSlot ?? "—"}
              questionCount={meta.questionCount}
              testLogicSaved={isSubjectFinalTest ? subjectCompleted : testLogicSaved}
              questionsGenerated={meta.questionsGenerated}
              questionsConfirmed={meta.questionsConfirmed}
              isSubjectFinalTest={isSubjectFinalTest}
              subjectCompleted={subjectCompleted}
              assignStatus={meta.assignStatus}
              canAssignTest={canAssignGroup(group.key)}
              canTriggerTest={canTriggerGroup(group.key)}
              onAssignTest={() => assignTestToGroup(group.key)}
              onTriggerTest={() => triggerTestForGroup(group.key)}
              onAssignStudents={openStudents}
              onOpenSchedule={() => openScheduleForGroup(group.batches)}
              onOpenSecurity={() => openSecurityForGroup(group.batches)}
              onGenerateQuestions={() => generateQuestionsForGroup(group.key)}
              onReviewQuestions={() => openReviewForGroup(group.key)}
              onRemove={handleRemoveBatch}
            />
          );
        })
      )}

      {isSubjectFinalTest && (
        <div className="card shadow-sm border-0 mb-2">
          <div className="card-header bg-white py-2">
            <span className="small fw-semibold">
              Level-wise Rules{" "}
              <Badge bg="warning" text="dark">
                Subject Final Test
              </Badge>
            </span>
          </div>
          <div className="card-body p-2 small">
            <div className="text-muted mb-2">
              Auto-applied at assign from predefined level rules (topics, difficulty).
            </div>
            {DEFAULT_LEVEL_RULES.map((r) => (
              <div key={r.level} className="d-flex justify-content-between border-bottom py-1">
                <span>
                  L{r.level} {r.label}
                </span>
                <span>
                  {r.questionCount} Q · {r.marksPerQuestion}m · Pass {r.passingPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuestionConfigModal
        show={showQuestionsModal && !isSubjectFinalTest}
        scheduleLabel={test.name}
        batchNames={batchConfigs.map((b) => b.batch_name)}
        testSubject={test.subject}
        testType={test.type}
        initialConfig={
          testQuestionLogic
            ? { logic: testQuestionLogic, logicSaved: testLogicSaved }
            : undefined
        }
        onHide={() => setShowQuestionsModal(false)}
        onSaveLogic={saveQuestionLogic}
      />

      <GeneratedQuestionsReviewModal
        show={showGeneratedQuestionsModal}
        scheduleLabel={
          activeScheduleGroup?.date && activeScheduleGroup?.time
            ? `${formatAssignDate(activeScheduleGroup.date)} · ${formatAssignTime(activeScheduleGroup.time)}`
            : "Schedule slot"
        }
        batchNames={
          activeScheduleGroup?.batches.map((b) => b.batch_name) ?? []
        }
        config={
          activeScheduleKey &&
          (isSubjectFinalTest
            ? sftLevelLogic
            : testQuestionLogic && testLogicSaved)
            ? {
                logic: isSubjectFinalTest
                  ? sftLevelLogic!
                  : testQuestionLogic!,
                questionIds:
                  groupQuestionSets[activeScheduleKey]?.questionIds ?? [],
                logicSaved: true,
                confirmed:
                  groupQuestionSets[activeScheduleKey]?.confirmed ?? false,
              }
            : null
        }
        showFlagAction={isSubjectFinalTest}
        onFlagQuestion={(questionId) => {
          setActionAlert({
            variant: "info",
            message: `Question ${questionId} flagged — Admin, Head Trainer, and Content Creator notified.`,
          });
        }}
        warnings={generationWarnings}
        onHide={() => setShowGeneratedQuestionsModal(false)}
        onRegenerate={() => {
          if (activeScheduleKey) generateQuestionsForGroup(activeScheduleKey);
        }}
        onConfirm={(questionIds) => {
          if (activeScheduleKey) saveQuestionConfig(questionIds, activeScheduleKey);
        }}
      />

      <StudentsManageModal
        show={showStudentsModal}
        batch={activeBatch ?? null}
        assignedIds={draftAssignedIds}
        isSubjectFinalTest={isSubjectFinalTest}
        testSubject={test.subject}
        onHide={() => setShowStudentsModal(false)}
        onAdd={(id) =>
          setDraftAssignedIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          )
        }
        onRemove={(id) =>
          setDraftAssignedIds((prev) => prev.filter((sid) => sid !== id))
        }
        onAddAll={() => {
          if (!activeBatch) return;
          const pool = getEligibleStudentsForAssign(
            activeBatch.batch_name,
            test.subject,
            isSubjectFinalTest
          );
          setDraftAssignedIds((prev) => [
            ...new Set([...prev, ...pool.map((s) => s.id)]),
          ]);
        }}
        onRemoveAll={() => {
          if (!activeBatch) return;
          const pool = getStudentsForBatch(activeBatch.batch_name);
          setDraftAssignedIds(
            pool
              .filter((s) => s.testTaken && draftAssignedIds.includes(s.id))
              .map((s) => s.id)
          );
        }}
        onSave={saveStudents}
      />

      <Modal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule Test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Date *</Form.Label>
                <Form.Control
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Time *</Form.Label>
                <Form.Control
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowScheduleModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!draftDate || !draftTime}
            onClick={saveSchedule}
          >
            Save Schedule
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showSecurityModal}
        onHide={() => setShowSecurityModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Report Release Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeGroupBatches.length > 0 && (
            <div className="bg-light rounded p-3 mb-3">
              <div className="fw-semibold small mb-2">
                Applies to {activeGroupBatches.length} batch(es)
              </div>
              {activeGroupBatches.map((batch) => (
                <div key={batch.batch_id} className="small text-muted">
                  {batch.batch_name} · {batch.course_name}
                </div>
              ))}
            </div>
          )}
          <Form.Check
            type="switch"
            id="auto-release"
            label="Auto-release test report"
            checked={autoRelease}
            onChange={(e) => setAutoRelease(e.target.checked)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSecurityModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={saveSecurity}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default function AssignTestScreen() {
  return (
    <TestPageShell showCardSearch={false}>
      <div className="px-4 py-3">
        <AssignTestDetail />
      </div>
    </TestPageShell>
  );
}
