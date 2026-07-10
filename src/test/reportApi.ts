import type { ReportListCard, TestReportDetail, SecurityViolationType } from "../data/reportMockData";
import {
  MOCK_REPORT_DETAIL_TEST_12_5,
  MOCK_REPORT_LIST,
  MOCK_STUDENT_REPORTS,
  REPORT_BATCHES_BY_COURSE,
  REPORT_COURSES_BY_TRACK,
  REPORT_SUBJECTS_BY_BATCH,
  REPORT_TRACKS,
  filterReportList,
  getReportDetailByTestId,
} from "../data/reportMockData";
import type {
  LiveProctoringFeed,
  ReportData,
  TestReportViewData,
} from "./types";

const releasedTests = new Set<string>(
  MOCK_REPORT_DETAIL_TEST_12_5.report_released
    ? [MOCK_REPORT_DETAIL_TEST_12_5.test_id]
    : []
);

function listCardToReportData(card: ReportListCard): ReportData {
  return {
    status: card.status,
    test_id: card.test_id,
    title: card.title,
    description: card.description,
    duration: card.duration,
    marks: card.marks,
    subject: card.subject,
    date: card.date,
    time: null,
    track: card.track,
    course: card.course,
    test_type: card.test_type,
    invited: card.invited,
    from_time: card.from_time,
    end_time: card.end_time,
    batch: card.batch,
  };
}

function detailToViewData(detail: TestReportDetail): TestReportViewData {
  return {
    test_name: detail.test_name,
    course_name: detail.course_name,
    batch_name: detail.batch_name,
    test_status: detail.test_status,
    exam_control_status: "none",
    test_start_time: detail.test_start_time,
    test_end_time: detail.test_end_time,
    duration: `${detail.duration} Minutes`,
    test_marks: detail.test_marks,
    test_type: detail.test_type,
    auto_release_test_report: detail.auto_release_test_report,
    report_released:
      releasedTests.has(detail.test_id) || detail.report_released,
    report: detail.students,
  };
}

function buildProctoringFeed(
  testId: string,
  detail: TestReportDetail
): LiveProctoringFeed {
  const events: LiveProctoringFeed["events"] = [];
  const studentCounters = new Map<string, LiveProctoringFeed["students"][0]>();

  const violatedStudents = detail.students.filter(
    (s) => s.display_status === "Terminated"
  );

  violatedStudents.forEach((student, index) => {
    studentCounters.set(student.ID, {
      student_id: student.ID,
      student_name: student.Student,
      session_status: "violated",
      violation_count: index === 0 ? 5 : 3,
      violation_penalty_percent: index === 0 ? 100 : 0,
      score_retention_percent: student.score_retention_percent ?? 0,
      proctoring_violated: true,
      event_counters:
        index === 0
          ? { APPLICATION_SWITCH: 3, TAB_SWITCH: 1, SUPER_KEY: 1 }
          : { APPLICATION_SWITCH: 2, TAB_SWITCH: 1 },
    });
  });

  const violationAssignments: Array<{
    type: SecurityViolationType;
    studentId: string;
    detail: string;
  }> = [
    { type: "APPLICATION_SWITCH", studentId: "234IU1E007", detail: "Switched to another application" },
    { type: "APPLICATION_SWITCH", studentId: "234IU1E007", detail: "Window focus lost" },
    { type: "APPLICATION_SWITCH", studentId: "234IU1E007", detail: "Desktop switch detected" },
    { type: "APPLICATION_SWITCH", studentId: "234IU1E022", detail: "Application switch during test" },
    { type: "APPLICATION_SWITCH", studentId: "234IU1E022", detail: "Alt+Tab detected" },
    { type: "TAB_SWITCH", studentId: "234IU1E007", detail: "Browser tab changed" },
    { type: "TAB_SWITCH", studentId: "234IU1E022", detail: "New tab opened" },
    { type: "SUPER_KEY", studentId: "234IU1E007", detail: "Windows/Super key pressed" },
  ];

  violationAssignments.forEach((row, index) => {
    const student = detail.students.find((s) => s.ID === row.studentId);
    events.push({
      id: `${testId}-evt-${index}`,
      student_id: row.studentId,
      student_name: student?.Student,
      event: row.type,
      severity: "high",
      event_at: new Date(2026, 6, 9, 16, 5 + index, 12).toISOString(),
      detail: row.detail,
      violation_count: (studentCounters.get(row.studentId)?.violation_count ?? 1),
      test_terminated: row.studentId === "234IU1E007" && row.type === "SUPER_KEY",
    });
  });

  return {
    test_id: testId,
    events,
    students: Array.from(studentCounters.values()),
    active_sessions: detail.test_status === "Live" ? 2 : 0,
    violated_students: studentCounters.size,
    students_with_violations: studentCounters.size,
    total_violation_events: detail.securityLogs.totalViolations,
    max_violation_attempts: 4,
    live_feed_active: detail.test_status === "Live",
    fetched_at: new Date().toISOString(),
  };
}

const proctoringByTest = new Map<string, LiveProctoringFeed>();

function ensureProctoringFeed(testId: string): LiveProctoringFeed | undefined {
  const cached = proctoringByTest.get(testId);
  if (cached) return cached;
  const detail = getReportDetailByTestId(testId);
  if (!detail) return undefined;
  const feed = buildProctoringFeed(testId, detail);
  proctoringByTest.set(testId, feed);
  return feed;
}

// Pre-build feed for the primary demo report
ensureProctoringFeed(MOCK_REPORT_DETAIL_TEST_12_5.test_id);

export async function fetchAllTracksForCourses() {
  await delay(100);
  return REPORT_TRACKS.map((track) => ({
    track_id: track,
    track_name: track,
  }));
}

export async function fetchCoursesByTrack(trackId: string) {
  await delay(100);
  return (REPORT_COURSES_BY_TRACK[trackId] ?? []).map((course) => ({
    course_id: course,
    course_name: course,
  }));
}

export async function fetchBatchesByCourse(courseId: string) {
  await delay(100);
  return (REPORT_BATCHES_BY_COURSE[courseId] ?? []).map((batch) => ({
    batch_id: batch,
    batch_name: batch,
  }));
}

export async function fetchSubjectsForBatch(
  _courseId: string,
  batchId: string
): Promise<string[]> {
  await delay(100);
  return REPORT_SUBJECTS_BY_BATCH[batchId] ?? [];
}

export async function fetchReportsList(filters: {
  track: string;
  subject: string;
  course: string;
  batch: string;
  liveOrCompleted: string;
  testType: string;
}): Promise<ReportData[]> {
  await delay(200);
  return filterReportList(MOCK_REPORT_LIST, {
    track: filters.track,
    course: filters.course,
    batch: filters.batch,
    subject: filters.subject,
    testType: filters.testType,
    liveOrCompleted: filters.liveOrCompleted,
  }).map(listCardToReportData);
}

export async function fetchTestReportDetail(
  testId: string,
  _options?: { live?: boolean }
): Promise<TestReportViewData> {
  await delay(250);
  const detail = getReportDetailByTestId(testId);
  if (!detail) {
    throw new Error("Report not found");
  }
  if (!proctoringByTest.has(testId)) {
    ensureProctoringFeed(testId);
  }
  return detailToViewData(detail);
}

export async function releaseTestReports(
  testId: string,
  _studentIds: string[]
): Promise<void> {
  await delay(400);
  releasedTests.add(testId);
}

export async function fetchLiveProctoringFeed(
  testId: string
): Promise<LiveProctoringFeed> {
  await delay(150);
  const feed = ensureProctoringFeed(testId);
  if (feed) return feed;
  return {
    test_id: testId,
    events: [],
    students: [],
    active_sessions: 0,
    violated_students: 0,
    total_violation_events: 0,
    live_feed_active: false,
  };
}

export async function fetchStudentTestReport(testId: string, studentId: string) {
  await delay(200);
  const mock = MOCK_STUDENT_REPORTS[studentId];
  if (!mock) {
    throw new Error("Student report not found");
  }

  return {
    test_summary: {
      time_taken_for_completion: mock.timeTaken.split(" / ")[0] ?? "0",
      total_time: mock.totalTime,
      score_secured: mock.scoreSecured,
      max_score: mock.maxScore,
      status: mock.status,
      percentage: mock.percentage,
      attempted_questions: mock.attemptedQuestions,
      total_questions: mock.totalQuestions,
      college_rank: mock.collegeRank,
      overall_rank: mock.overallRank,
      test_start_time: "9-7-26 04:00 PM",
      test_end_time: "9-7-26 04:28 PM",
      actual_test_start_time: "9-7-26 04:08 PM",
      actual_test_end_time: "9-7-26 04:26 PM",
    },
    topics: {
      good: mock.goodTopics,
      average: mock.averageTopics,
      poor: mock.poorTopics,
    },
    proctoring: {
      integrity_score: mock.integrityScore,
      violation: {
        count: mock.violations.length,
        data: mock.violations.map((v) => ({
          type: v.type,
          time: v.time,
        })),
      },
    },
    answers: {
      mcq: mock.mcq.map((q) => ({
        question: q.question,
        topic: q.topic,
        options: [q.userAnswer, q.correctAnswer, "Option C", "Option D"],
        user_answer: q.userAnswer,
        correct_answer: q.correctAnswer,
        score_secured: q.score.split("/")[0] ?? "0",
        max_score: q.score.split("/")[1] ?? "1",
        status: q.status,
        Explanation: "",
      })),
      coding: mock.coding.map((q) => ({
        Qn: q.question,
        topic: q.topic,
        user_answer: "Not attempted",
        score_secured: q.score.split("/")[0] ?? "0",
        max_score: q.score.split("/")[1] ?? "2",
        status: q.status,
        testcases: "0/0",
      })),
    },
    test_id: testId,
    student_id: studentId,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
