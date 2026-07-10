import React, { useEffect, useState } from "react";
import { Modal, Spinner } from "react-bootstrap";
import { FaRegEye } from "react-icons/fa";
import { fetchStudentTestReport } from "../test/reportApi";

interface Data1 {
  timeTaken: string;
  total_time: string;
  score: {
    user: string;
    total: string;
  };
  result: {
    pass: boolean;
    status: string;
    cutoff: string;
  };
  problems: {
    user: string;
    total: string;
  };
  rank: {
    college_rank: string | number;
    overall_rank: string | number;
  };
  time: {
    start: string;
    end: string;
    actual_start: string;
    actual_end: string;
  };
  good: string[];
  average: string[];
  bad: string[];
}

interface question {
  id: number;
  question: string;
  testcase?: string;
  answer?: {
    user: string;
    correct: string;
  };
  userAnswerFiles?: Record<string, string>;
  correctAnswerFiles?: Record<string, { Ans: string }>;
  selectedFile?: string;
  options?: [option, option, option, option];
  score: string;
  status: string;
  topic: string;
  explanation: string;
}

interface option {
  data: string;
  user: boolean;
  correct: boolean;
}

interface questionData {
  mcq: question[];
  coding: question[];
}

interface ViolationRecord {
  [key: string]: unknown;
}

interface ViolationSummary {
  count: number;
  data: ViolationRecord[];
}

const EMPTY_VIOLATION_SUMMARY: ViolationSummary = { count: 0, data: [] };

const getProctoringPayload = (
  apiData: Record<string, unknown>
): Record<string, unknown> | undefined => {
  const proctoring = apiData.proctoring;
  return proctoring && typeof proctoring === "object"
    ? (proctoring as Record<string, unknown>)
    : undefined;
};

const parseIntegrityScore = (apiData: Record<string, unknown>): number | null => {
  const raw = getProctoringPayload(apiData)?.integrity_score;
  if (raw == null || raw === "") return null;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
};

const parseViolationSummary = (apiData: Record<string, unknown>): ViolationSummary => {
  const raw = getProctoringPayload(apiData)?.violation;
  if (!raw || typeof raw !== "object") return EMPTY_VIOLATION_SUMMARY;

  const violation = raw as { count?: number; data?: unknown };
  const data = Array.isArray(violation.data)
    ? (violation.data as ViolationRecord[])
    : [];

  return {
    count: data.length,
    data,
  };
};

const getIntegrityScoreColor = (score: number): string => {
  const clamped = Math.max(0, Math.min(100, score));
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 65%, 38%)`;
};

const SUMMARY_CARD_CLASS =
  "test-report-summary-card text-center rounded-3 border bg-white";
const SUMMARY_CARD_STYLE: React.CSSProperties = {
  backgroundColor: "#ffffff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};
const SUMMARY_VALUE_STYLE: React.CSSProperties = {
  fontWeight: 400,
  fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
  lineHeight: 1.2,
  wordBreak: "break-word",
};
const SUMMARY_VALUE_LARGE_STYLE: React.CSSProperties = {
  ...SUMMARY_VALUE_STYLE,
  fontWeight: 700,
  fontSize: "clamp(1.35rem, 3vw, 1.75rem)",
};
const SUMMARY_TIME_VALUE_STYLE: React.CSSProperties = {
  color: "#34495e",
  fontWeight: 400,
  fontSize: "clamp(0.7rem, 1.6vw, 0.85rem)",
  lineHeight: 1.35,
  wordBreak: "break-word",
};

const formatViolationField = (value: unknown): string => {
  if (value == null || value === "") return "—";
  return String(value);
};

const formatViolationType = (type: unknown): string => {
  if (typeof type !== "string") return "Violation";
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const SUMMARY_LABEL_CLASS = "mb-0 fw-bold text-uppercase";
const SUMMARY_LABEL_STYLE: React.CSSProperties = {
  color: "#2c3e50",
  fontSize: "0.75rem",
  letterSpacing: "0.04em",
};

export interface StudentReportProps {
  studentId: string;
  testId: string;
  testType?: string;
}

const StudentReport: React.FC<StudentReportProps> = ({
  studentId,
  testId,
  testType = "",
}) => {
  const [choice, setChoice] = useState<"mcq" | "coding">("mcq");
  const [selectedFiles, setSelectedFiles] = useState<Record<number, string>>({});
  const [data, setData] = useState<Data1>({
    timeTaken: "",
    total_time: "",
    score: { user: "", total: "" },
    result: { pass: false, status: "", cutoff: "" },
    problems: { user: "", total: "" },
    rank: { college_rank: "", overall_rank: "" },
    time: { start: "", end: "", actual_start: "", actual_end: "" },
    good: [],
    average: [],
    bad: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [integrityScore, setIntegrityScore] = useState<number | null>(null);
  const [violationSummary, setViolationSummary] =
    useState<ViolationSummary>(EMPTY_VIOLATION_SUMMARY);
  const [popupData, setPopupData] = useState<question | null>(null);
  const [questionsData, setQuestionsData] = useState<questionData>({
    mcq: [],
    coding: [],
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const violationCount = violationSummary.data.length;
  const hasMcq = questionsData.mcq.length > 0;
  const hasCoding = questionsData.coding.length > 0;

  const handleFileSelection = (questionId: number, fileName: string) => {
    setSelectedFiles((prev) => ({ ...prev, [questionId]: fileName }));
  };

  useEffect(() => {
    if (!testId || !studentId) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiData = await fetchStudentTestReport(testId, studentId);
        if (cancelled) return;

        setData({
          timeTaken: `${apiData.test_summary.time_taken_for_completion} / ${apiData.test_summary.total_time}`,
          total_time: apiData.test_summary.total_time,
          score: {
            user: apiData.test_summary.score_secured.toString(),
            total: apiData.test_summary.max_score.toString(),
          },
          result: {
            pass:
              apiData.test_summary.status === "Passed" ||
              apiData.test_summary.status === "Completed",
            status: apiData.test_summary.percentage >= 40 ? "Passed" : "Failed",
            cutoff: ">=40%",
          },
          problems: {
            user: apiData.test_summary.attempted_questions.toString(),
            total: apiData.test_summary.total_questions.toString(),
          },
          rank: {
            college_rank: apiData.test_summary.college_rank?.toString() || "--",
            overall_rank: apiData.test_summary.overall_rank?.toString() || "--",
          },
          time: {
            start: apiData.test_summary.test_start_time || "Not started",
            end: apiData.test_summary.test_end_time || "Not completed",
            actual_start: apiData.test_summary.actual_test_start_time || "--",
            actual_end: apiData.test_summary.actual_test_end_time || "--",
          },
          good: apiData.topics?.good || [],
          average: apiData.topics?.average || [],
          bad: apiData.topics?.poor || [],
        });

        setIntegrityScore(parseIntegrityScore(apiData));
        setViolationSummary(parseViolationSummary(apiData));

        const mcqQuestions = (apiData.answers?.mcq ?? []).map(
          (q: Record<string, unknown>, index: number) => ({
            id: index + 1,
            question: String(q.question ?? ""),
            options: (q.options as string[]).map((opt) => ({
              data: opt,
              user: q.user_answer === opt,
              correct: q.correct_answer === opt,
            })),
            score: `${q.score_secured}/${q.max_score}`,
            status: String(q.status ?? "").toLowerCase(),
            topic: String(q.topic ?? ""),
            explanation: String(q.Explanation ?? ""),
          })
        );

        const codingQuestions = (apiData.answers?.coding ?? []).map(
          (q: Record<string, unknown>, index: number) => {
            const questionId = index + 1;
            let userAnswer = "Not attempted";
            let userAnswerFiles: Record<string, string> = {};
            let selectedFile = "";

            if (q.user_answer) {
              if (typeof q.user_answer === "string") {
                userAnswer = q.user_answer;
              } else if (typeof q.user_answer === "object") {
                userAnswerFiles = q.user_answer as Record<string, string>;
                const fileKeys = Object.keys(userAnswerFiles);
                if (fileKeys.length > 0) {
                  selectedFile = fileKeys[0];
                  userAnswer = userAnswerFiles[fileKeys[0]];
                }
              }
            }

            let correctAnswer = String(q.Ans ?? "No answer provided");
            let correctAnswerFiles: Record<string, { Ans: string }> = {};

            if (q.Code_Validation && typeof q.Code_Validation === "object") {
              const fileKeys = Object.keys(q.Code_Validation as object);
              fileKeys.forEach((fileName) => {
                const entry = (q.Code_Validation as Record<string, { Ans?: string }>)[
                  fileName
                ];
                if (entry?.Ans) {
                  correctAnswerFiles[fileName] = { Ans: entry.Ans };
                }
              });
              if (correctAnswerFiles[fileKeys[0]]) {
                correctAnswer = correctAnswerFiles[fileKeys[0]].Ans;
              }
            }

            return {
              id: questionId,
              question: String(q.Qn ?? ""),
              answer: { user: userAnswer, correct: correctAnswer },
              userAnswerFiles:
                Object.keys(userAnswerFiles).length > 0 ? userAnswerFiles : undefined,
              correctAnswerFiles:
                Object.keys(correctAnswerFiles).length > 0
                  ? correctAnswerFiles
                  : undefined,
              selectedFile,
              testcase: String(q.testcases ?? "0/0"),
              score: `${q.score_secured}/${q.max_score}`,
              status: String(q.status ?? "").toLowerCase(),
              topic: String(q.topic ?? ""),
              explanation: "",
            };
          }
        );

        setQuestionsData({ mcq: mcqQuestions as questionData["mcq"], coding: codingQuestions });
      } catch (err) {
        console.error("Error fetching student test report:", err);
        if (!cancelled) setError("Unable to load student report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [studentId, testId]);

  useEffect(() => {
    if (!hasMcq && hasCoding && choice !== "coding") {
      setChoice("coding");
      return;
    }
    if (!hasCoding && hasMcq && choice !== "mcq") {
      setChoice("mcq");
    }
  }, [hasMcq, hasCoding, choice]);

  const handleAnswerClick = (questionRow: question) => {
    setPopupData(questionRow);
    setShowModal(true);
  };

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const renderQuestionStatus = (status: string) => {
    if (status === "correct") return <td className="text-success">Correct</td>;
    if (status === "partial") return <td className="text-warning">Partial</td>;
    if (status === "wrong") return <td className="text-danger">Wrong</td>;
    if (status === "skipped") return <td className="text-danger">Skipped</td>;
    return (
      <td style={{ color: "orange" }}>
        {status === "not attempted" ? "Not Attempted" : status}
      </td>
    );
  };

  const activeTopicFilters = Object.keys(expandedTopics).filter(
    (topic) => expandedTopics[topic]
  );
  const filteredQuestions =
    activeTopicFilters.length > 0
      ? questionsData[choice].filter((questionRow) =>
          activeTopicFilters.some((topic) => questionRow.topic === topic)
        )
      : questionsData[choice];

  return (
    <>
      <style>{`
        .test-report-summary-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: 1fr;
          width: 100%;
        }
        @media (min-width: 576px) {
          .test-report-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 992px) {
          .test-report-summary-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        .test-report-summary-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 7.25rem;
          height: 100%;
          padding: clamp(0.65rem, 2vw, 1rem);
          background-color: #ffffff !important;
        }
      `}</style>

      <div className="position-relative">
        {error && <div className="alert alert-warning py-2 small mb-3">{error}</div>}

        <div
          className="container-fluid border rounded-3 shadow-sm bg-white"
          style={{ padding: "clamp(0.75rem, 2.5vw, 2rem)" }}
        >
          <div className="test-report-summary-grid">
            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div className="mb-2" style={{ ...SUMMARY_VALUE_STYLE, color: "#3498db" }}>
                {data.timeTaken || "0"}
              </div>
              <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                Time Taken for Completion
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div
                className="mb-2"
                style={{
                  ...SUMMARY_VALUE_STYLE,
                  color: data.result.status === "Passed" ? "#27ae60" : "#e74c3c",
                }}
              >
                {data.score.user || "0"}
              </div>
              <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                Scored out of {data.score.total || "0"}
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div
                className="mb-2"
                style={{
                  ...SUMMARY_VALUE_STYLE,
                  color: data.result.status === "Passed" ? "#27ae60" : "#e74c3c",
                }}
              >
                {data.result.status || "Failed"}
              </div>
              <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                Test Status (Cutoff: {data.result.cutoff || "0%"})
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div
                className="mb-2"
                style={{
                  ...SUMMARY_VALUE_LARGE_STYLE,
                  color:
                    integrityScore != null
                      ? getIntegrityScoreColor(integrityScore)
                      : "#6c757d",
                }}
              >
                {integrityScore != null ? `${integrityScore}%` : "—"}
              </div>
              <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                Integrity Score
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div className="mb-2" style={{ ...SUMMARY_VALUE_STYLE, color: "#f39c12" }}>
                {data.problems.user || "0"}
              </div>
              <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                Problems Attempted out of {data.problems.total || "0"}
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div className="mb-0" style={SUMMARY_TIME_VALUE_STYLE}>
                {data.time.actual_start || "0"}
              </div>
              <p
                className="fw-bold mb-2 text-uppercase"
                style={{ ...SUMMARY_LABEL_STYLE, fontSize: "0.7rem" }}
              >
                Test Assigned at
              </p>
              <div className="mb-0" style={SUMMARY_TIME_VALUE_STYLE}>
                {data.total_time || "0"}
              </div>
              <p
                className={SUMMARY_LABEL_CLASS}
                style={{ ...SUMMARY_LABEL_STYLE, fontSize: "0.7rem" }}
              >
                Duration
              </p>
            </div>

            <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
              <div className="mb-0" style={SUMMARY_TIME_VALUE_STYLE}>
                {data.time.start || "0"}
              </div>
              <p
                className="mb-2 fw-bold text-uppercase"
                style={{ ...SUMMARY_LABEL_STYLE, fontSize: "0.7rem" }}
              >
                Test Started at
              </p>
              <div className="mb-0" style={SUMMARY_TIME_VALUE_STYLE}>
                {data.time.end || "0"}
              </div>
              <p
                className={SUMMARY_LABEL_CLASS}
                style={{ ...SUMMARY_LABEL_STYLE, fontSize: "0.7rem" }}
              >
                Test Ended at
              </p>
            </div>

            <div
              role="button"
              tabIndex={0}
              className={SUMMARY_CARD_CLASS}
              style={{
                ...SUMMARY_CARD_STYLE,
                cursor: violationCount > 0 ? "pointer" : "default",
              }}
              onClick={() => {
                if (violationCount > 0) setShowViolationsModal(true);
              }}
              onKeyDown={(e) => {
                if (violationCount > 0 && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setShowViolationsModal(true);
                }
              }}
              title={violationCount > 0 ? "View violation details" : undefined}
            >
              <div
                className="mb-2"
                style={{
                  ...SUMMARY_VALUE_LARGE_STYLE,
                  color: violationCount > 0 ? "#dc3545" : "#6c757d",
                }}
              >
                {violationCount}
              </div>
              <p
                className={SUMMARY_LABEL_CLASS}
                style={{ ...SUMMARY_LABEL_STYLE, color: "#fd7e14" }}
              >
                Violations
              </p>
            </div>

            {testType === "Final Test" && (
              <>
                <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
                  <div className="mb-2" style={{ ...SUMMARY_VALUE_STYLE, color: "#9b59b6" }}>
                    {data.rank.college_rank !== undefined &&
                    data.rank.college_rank !== "-1" &&
                    data.rank.college_rank !== -1
                      ? data.rank.college_rank.toString()
                      : "--"}
                  </div>
                  <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                    College Rank
                  </p>
                </div>
                <div className={SUMMARY_CARD_CLASS} style={SUMMARY_CARD_STYLE}>
                  <div className="mb-2" style={{ ...SUMMARY_VALUE_STYLE, color: "#9b59b6" }}>
                    {data.rank.overall_rank !== undefined &&
                    data.rank.overall_rank !== "-1" &&
                    data.rank.overall_rank !== -1
                      ? data.rank.overall_rank.toString()
                      : "--"}
                  </div>
                  <p className={SUMMARY_LABEL_CLASS} style={SUMMARY_LABEL_STYLE}>
                    Overall Rank
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {(data.good.length > 0 || data.average.length > 0 || data.bad.length > 0) && (
          <div className="container-fluid mt-4 border rounded-2 shadow pb-2">
            {data.good.length > 0 && (
              <div className="row align-items-center pb-2">
                <div className="col-2 mt-2 p-2 ps-3">
                  <span>Very Good :</span>
                </div>
                <div className="col-10 d-flex flex-wrap">
                  {data.good.map((item) => (
                    <span
                      key={item}
                      style={{
                        backgroundColor: expandedTopics[item] ? "#6eadef" : "initial",
                        color: expandedTopics[item] ? "white" : "initial",
                      }}
                      title={item}
                      role="button"
                      className="mt-2 justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2 w-auto"
                      onClick={() => toggleTopic(item)}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.average.length > 0 && (
              <div className="row align-items-center pb-2">
                <div className="col-2 mt-2 p-2 ps-3">
                  <span>Average in :</span>
                </div>
                <div className="col-10 d-flex flex-wrap align-items-center">
                  {data.average.map((item) => (
                    <span
                      key={item}
                      style={{
                        backgroundColor: expandedTopics[item] ? "#6eadef" : "initial",
                        color: expandedTopics[item] ? "white" : "initial",
                      }}
                      title={item}
                      role="button"
                      className="mt-2 justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2 w-auto"
                      onClick={() => toggleTopic(item)}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.bad.length > 0 && (
              <div className="row align-items-center">
                <div className="col-2 mt-2 p-2 ps-3">
                  <span>Poor in :</span>
                </div>
                <div className="col-10 d-flex flex-wrap align-items-center">
                  {data.bad.map((item) => (
                    <span
                      key={item}
                      style={{
                        backgroundColor: expandedTopics[item] ? "#6eadef" : "initial",
                        color: expandedTopics[item] ? "white" : "initial",
                      }}
                      title={item}
                      role="button"
                      className="mt-2 justify-content-center border rounded-2 mx-3 text-center p-1 shadow py-2 w-auto"
                      onClick={() => toggleTopic(item)}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(hasMcq || hasCoding) && (
          <div className="container-fluid mt-4 pb-3 pt-3 border rounded-2 shadow">
            {hasMcq && (
              <span
                onClick={() => setChoice("mcq")}
                role="button"
                className={`ms-3 me-5 ${choice === "mcq" ? "border-2 border-bottom" : ""}`}
              >
                MCQ&apos;s
              </span>
            )}
            {hasCoding && (
              <span
                role="button"
                onClick={() => setChoice("coding")}
                className={`ms-3 ${choice === "coding" ? "border-2 border-bottom" : ""}`}
              >
                Coding
              </span>
            )}
            <div className="table-responsive pt-3 px-3">
              <table className="table">
                <thead>
                  <tr>
                    <th className="text-center">Q.no</th>
                    <th className="text-center">Question</th>
                    <th className="text-center">Answer</th>
                    {choice === "coding" && (
                      <th className="text-center">
                        <span style={{ whiteSpace: "nowrap" }}>Test Cases</span>
                      </th>
                    )}
                    <th className="text-center">Score</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "center" }}>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((questionRow) => (
                      <tr key={questionRow.id}>
                        <td>{questionRow.id}</td>
                        <td style={{ textAlign: "start" }}>
                          {questionRow.question.length > 80
                            ? `${questionRow.question.substring(0, 80)}...`
                            : questionRow.question}
                        </td>
                        <td
                          className="text-center"
                          onClick={() => handleAnswerClick(questionRow)}
                        >
                          <FaRegEye role="button" />
                        </td>
                        {choice === "coding" && (
                          <td className="text-center">{questionRow.testcase}</td>
                        )}
                        <td className="text-center">{questionRow.score}</td>
                        {renderQuestionStatus(questionRow.status)}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={choice === "coding" ? 6 : 5} className="text-center">
                        No questions available for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="xl"
          className="custom-modal test-flow-modal"
          centered
          backdropClassName="test-completion-modal-backdrop"
        >
          <Modal.Body className="border border-black rounded-3">
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "10px", right: "10px" }}
            />
            <h4 className="text-center">Answer</h4>
            {popupData && (
              <div className="p-4">
                {popupData.question && (
                  <pre className="pb-3">
                    {popupData.id}. {popupData.question}
                  </pre>
                )}
                {popupData.answer && (
                  <div className="container-fluid">
                    {popupData.userAnswerFiles &&
                      Object.keys(popupData.userAnswerFiles).length > 1 && (
                        <div className="row mb-3">
                          <div className="col-12">
                            <label className="form-label fw-bold mb-2">
                              Select file to view:
                            </label>
                            <div className="d-flex flex-wrap gap-2">
                              {Object.keys(popupData.userAnswerFiles).map((fileName) => {
                                const isSelected =
                                  (selectedFiles[popupData.id] ||
                                    popupData.selectedFile ||
                                    Object.keys(popupData.userAnswerFiles!)[0]) ===
                                  fileName;
                                return (
                                  <button
                                    key={fileName}
                                    type="button"
                                    className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() =>
                                      handleFileSelection(popupData.id, fileName)
                                    }
                                  >
                                    {fileName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    <div className="row gap-2">
                      <div className="col border border-black rounded-3 p-3 px-5 d-flex flex-column">
                        <p className="fw-bold pb-0 mb-0">
                          Your answer
                          {popupData.userAnswerFiles &&
                            Object.keys(popupData.userAnswerFiles).length > 1 && (
                              <span className="text-muted ms-2">
                                (
                                {selectedFiles[popupData.id] ||
                                  popupData.selectedFile ||
                                  Object.keys(popupData.userAnswerFiles)[0]}
                                )
                              </span>
                            )}
                        </p>
                        <hr className="mt-0 pt-0" />
                        <div className="w-100 overflowX-auto flex-grow-1">
                          <pre className="mb-0">
                            {popupData.userAnswerFiles &&
                            Object.keys(popupData.userAnswerFiles).length > 1
                              ? popupData.userAnswerFiles[
                                  selectedFiles[popupData.id] ||
                                    popupData.selectedFile ||
                                    Object.keys(popupData.userAnswerFiles)[0]
                                ] || popupData.answer.user
                              : popupData.answer.user}
                          </pre>
                        </div>
                      </div>
                      <div className="col border border-black rounded-2 p-3 px-5 d-flex flex-column">
                        <p className="fw-bold pb-0 mb-0">
                          Optimal answer
                          {popupData.correctAnswerFiles &&
                            Object.keys(popupData.correctAnswerFiles).length > 1 && (
                              <span className="text-muted ms-2">
                                (
                                {selectedFiles[popupData.id] ||
                                  popupData.selectedFile ||
                                  Object.keys(popupData.correctAnswerFiles)[0]}
                                )
                              </span>
                            )}
                        </p>
                        <hr className="mt-0 pt-0" />
                        <div className="w-100 overflowX-auto flex-grow-1">
                          <pre className="mb-0">
                            {popupData.correctAnswerFiles &&
                            Object.keys(popupData.correctAnswerFiles).length > 1
                              ? popupData.correctAnswerFiles[
                                  selectedFiles[popupData.id] ||
                                    popupData.selectedFile ||
                                    Object.keys(popupData.correctAnswerFiles)[0]
                                ]?.Ans || popupData.answer.correct
                              : popupData.answer.correct}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {popupData.options?.map((optionItem, index) => {
                  const isUserAnswer = optionItem.user;
                  const isCorrectAnswer = optionItem.correct;
                  const optionstyles =
                    isUserAnswer && isCorrectAnswer
                      ? { color: "green" }
                      : isUserAnswer
                        ? { color: "red" }
                        : isCorrectAnswer
                          ? { color: "green" }
                          : {};
                  return (
                    <div key={index}>
                      <input
                        type="radio"
                        disabled
                        checked={isUserAnswer}
                        className="me-2"
                        readOnly
                      />
                      <label htmlFor={`option-${index}`} style={optionstyles}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div>{optionItem.data}</div>
                          <div className="d-flex justify-content-end">
                            {isUserAnswer && (
                              <span className="text-dark text-end ps-3">Your answer</span>
                            )}
                            {isCorrectAnswer && !isUserAnswer && (
                              <span className="text-dark text-end ps-3">
                                Correct answer
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
                {popupData.status === "wrong" &&
                  popupData.explanation &&
                  !["", "-"].includes(popupData.explanation.trim().toLowerCase()) && (
                    <div className="mt-3">
                      <p className="fw-bold">Explanation:</p>
                      <p>{popupData.explanation}</p>
                    </div>
                  )}
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal
          show={showViolationsModal}
          onHide={() => setShowViolationsModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Violations ({violationCount})</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {violationCount === 0 ? (
              <p className="text-muted mb-0">No violation details available.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {violationSummary.data.map((item, index) => (
                  <li
                    key={`${formatViolationField(item.recorded_at)}-${index}`}
                    className="list-group-item d-flex justify-content-between align-items-center gap-3 px-0"
                  >
                    <span className="text-danger fw-medium">
                      {formatViolationType(item.violation_type)}
                    </span>
                    <span className="text-muted small text-end">
                      {formatViolationField(item.recorded_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Modal.Body>
        </Modal>

        {loading && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(255, 255, 255, 0.8)", zIndex: 1000 }}
          >
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentReport;
