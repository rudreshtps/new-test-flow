/** Test report mock data — aligned with LMS-Admin-Flow-Frontend report types */

export type ReportStudentDisplayStatus =
  | "Assigned"
  | "Absent"
  | "In Progress"
  | "Completed"
  | "Aborted"
  | "Terminated";

export type ReportListCard = {
  test_id: string;
  title: string;
  description: string;
  duration: string;
  marks: number;
  subject: string;
  date: string | null;
  from_time: string | null;
  end_time: string | null;
  track: string;
  course: string;
  batch: string;
  test_type: string;
  invited: number;
  status: "Live" | "Completed";
};

export type ReportStudentRow = {
  ID: string;
  Student: string;
  College: string;
  Branch: string;
  Category: string;
  Rank: number;
  Max_marks: number;
  Obtained_marks: number | null;
  Percentage: number | null;
  score_retention_percent: number | null;
  display_status: ReportStudentDisplayStatus;
};

export type SecurityViolationType =
  | "APPLICATION_SWITCH"
  | "TAB_SWITCH"
  | "SUPER_KEY";

export type TestReportDetail = {
  test_id: string;
  test_name: string;
  course_name: string;
  batch_name: string;
  test_status: "Live" | "Completed" | "Paused" | "Aborted";
  test_start_time: string;
  test_end_time: string;
  duration: string;
  test_marks: number;
  test_type: string;
  auto_release_test_report: boolean;
  report_released: boolean;
  securityLogs: {
    totalViolations: number;
    violations: { type: SecurityViolationType; count: number }[];
  };
  students: ReportStudentRow[];
};

export type StudentTestReportDetail = {
  studentId: string;
  studentName: string;
  timeTaken: string;
  totalTime: string;
  scoreSecured: number;
  maxScore: number;
  status: string;
  percentage: number;
  attemptedQuestions: number;
  totalQuestions: number;
  collegeRank: string;
  overallRank: string;
  integrityScore: number;
  goodTopics: string[];
  averageTopics: string[];
  poorTopics: string[];
  mcq: {
    question: string;
    topic: string;
    score: string;
    status: string;
    userAnswer: string;
    correctAnswer: string;
  }[];
  coding: {
    question: string;
    topic: string;
    score: string;
    status: string;
  }[];
  violations: { type: string; time: string }[];
};

export const REPORT_TRACKS = ["IT", "Aptitude", "Full Stack"];

export const REPORT_COURSES_BY_TRACK: Record<string, string[]> = {
  IT: ["Example course", "12M 2026", "FYP 2026"],
  Aptitude: ["Aptitude Course"],
  "Full Stack": ["Full Stack Course"],
};

export const REPORT_BATCHES_BY_COURSE: Record<string, string[]> = {
  "Example course": ["BC7"],
  "12M 2026": ["Batch-01", "Batch-03", "BC7"],
  "FYP 2026": ["Batch-04"],
};

export const REPORT_SUBJECTS_BY_BATCH: Record<string, string[]> = {
  BC7: ["Python", "SQL"],
  "Batch-01": ["SQL", "Python"],
  "Batch-03": ["Python"],
  "Batch-04": ["SQL"],
};

export const REPORT_TEST_TYPES = [
  "Weekly Test",
  "Revision Test",
  "Practice Test",
  "Final Test",
  "Subject Final Test",
  "Overall Test",
];

const TEST_12_5_STUDENTS: ReportStudentRow[] = [
  {
    ID: "234IU1E007",
    Student: "Likhith V",
    College: "ABCX",
    Branch: "IS",
    Category: "Swapnodaya",
    Rank: 1,
    Max_marks: 12,
    Obtained_marks: 1,
    Percentage: 8.3,
    score_retention_percent: 0,
    display_status: "Terminated",
  },
  {
    ID: "234IU1E022",
    Student: "Shaik Rihana",
    College: "CITM",
    Branch: "IS",
    Category: "Exallience",
    Rank: 2,
    Max_marks: 12,
    Obtained_marks: 0,
    Percentage: 0,
    score_retention_percent: 100,
    display_status: "Terminated",
  },
  {
    ID: "234IU1E023",
    Student: "Sai Kumar",
    College: "CITM",
    Branch: "CS",
    Category: "Exallience",
    Rank: 0,
    Max_marks: 12,
    Obtained_marks: null,
    Percentage: null,
    score_retention_percent: null,
    display_status: "Absent",
  },
  {
    ID: "234IU1E024",
    Student: "Priya Sharma",
    College: "ABCX",
    Branch: "CS",
    Category: "Swapnodaya",
    Rank: 3,
    Max_marks: 12,
    Obtained_marks: 8,
    Percentage: 66.7,
    score_retention_percent: 100,
    display_status: "Completed",
  },
  {
    ID: "234IU1E025",
    Student: "Rohan Mehta",
    College: "CITM",
    Branch: "IS",
    Category: "Exallience",
    Rank: 0,
    Max_marks: 12,
    Obtained_marks: 3,
    Percentage: 25,
    score_retention_percent: 100,
    display_status: "Aborted",
  },
  {
    ID: "234IU1E026",
    Student: "Ananya Reddy",
    College: "ABCX",
    Branch: "CS",
    Category: "Swapnodaya",
    Rank: 0,
    Max_marks: 12,
    Obtained_marks: null,
    Percentage: null,
    score_retention_percent: null,
    display_status: "In Progress",
  },
  {
    ID: "234IU1E027",
    Student: "Karan Singh",
    College: "CITM",
    Branch: "IS",
    Category: "Exallience",
    Rank: 0,
    Max_marks: 12,
    Obtained_marks: null,
    Percentage: null,
    score_retention_percent: null,
    display_status: "Assigned",
  },
];

export const MOCK_REPORT_DETAIL_TEST_12_5: TestReportDetail = {
  test_id: "rpt-test-12-5",
  test_name: "Test 12-5",
  course_name: "Example course",
  batch_name: "BC7",
  test_status: "Completed",
  test_start_time: "9-7-26 04:00 PM",
  test_end_time: "9-7-26 04:28 PM",
  duration: "20",
  test_marks: 12,
  test_type: "Practice Test",
  auto_release_test_report: true,
  report_released: true,
  securityLogs: {
    totalViolations: 8,
    violations: [
      { type: "APPLICATION_SWITCH", count: 5 },
      { type: "TAB_SWITCH", count: 2 },
      { type: "SUPER_KEY", count: 1 },
    ],
  },
  students: TEST_12_5_STUDENTS,
};

export const MOCK_REPORT_LIST: ReportListCard[] = [
  {
    test_id: MOCK_REPORT_DETAIL_TEST_12_5.test_id,
    title: "Test 12-5",
    description: "—",
    duration: "20",
    marks: 12,
    subject: "Python",
    date: "2026-07-09",
    from_time: "16:08",
    end_time: "16:28",
    track: "IT",
    course: "Example course",
    batch: "BC7",
    test_type: "Practice Test",
    invited: 7,
    status: "Completed",
  },
  {
    test_id: "rpt-testing-9-1",
    title: "testing 9.1",
    description: "df",
    duration: "60",
    marks: 20,
    subject: "Python",
    date: "2026-07-09",
    from_time: "15:45",
    end_time: "16:45",
    track: "IT",
    course: "Example course",
    batch: "BC7",
    test_type: "Final Test",
    invited: 6,
    status: "Completed",
  },
  {
    test_id: "rpt-dev-junk-apt",
    title: "Dev junk Aptitude test",
    description: "—",
    duration: "60",
    marks: 20,
    subject: "SQL",
    date: "2026-07-09",
    from_time: "14:00",
    end_time: "15:00",
    track: "IT",
    course: "Example course",
    batch: "BC7",
    test_type: "Final Test",
    invited: 6,
    status: "Completed",
  },
  {
    test_id: "rpt-ft-live-001",
    title: "SQL  - 12M 2026 - FT001",
    description: "Subject final test for SQL — live session.",
    duration: "120",
    marks: 100,
    subject: "SQL",
    date: "2026-07-10",
    from_time: "14:00",
    end_time: null,
    track: "IT",
    course: "12M 2026",
    batch: "Batch-03",
    test_type: "Subject Final Test",
    invited: 30,
    status: "Live",
  },
];

export const MOCK_STUDENT_REPORTS: Record<string, StudentTestReportDetail> = {
  "234IU1E007": {
    studentId: "234IU1E007",
    studentName: "Likhith V",
    timeTaken: "18 / 20",
    totalTime: "20 min",
    scoreSecured: 1,
    maxScore: 12,
    status: "Failed",
    percentage: 8.3,
    attemptedQuestions: 3,
    totalQuestions: 12,
    collegeRank: "3",
    overallRank: "12",
    integrityScore: 0,
    goodTopics: ["SELECT basics"],
    averageTopics: [],
    poorTopics: ["Filtering", "INNER JOIN"],
    mcq: [
      {
        question: "Which clause filters rows before grouping?",
        topic: "Filtering",
        score: "0/1",
        status: "wrong",
        userAnswer: "HAVING",
        correctAnswer: "WHERE",
      },
      {
        question: "Write a SELECT to list all columns from employees.",
        topic: "SELECT basics",
        score: "1/1",
        status: "correct",
        userAnswer: "SELECT * FROM employees",
        correctAnswer: "SELECT * FROM employees",
      },
    ],
    coding: [
      {
        question: "Join customers and orders to show customer name with order id.",
        topic: "INNER JOIN",
        score: "0/2",
        status: "wrong",
      },
    ],
    violations: [
      { type: "APPLICATION_SWITCH", time: "04:05 PM" },
      { type: "TAB_SWITCH", time: "04:12 PM" },
      { type: "SUPER KEY", time: "04:18 PM" },
    ],
  },
  "234IU1E024": {
    studentId: "234IU1E024",
    studentName: "Priya Sharma",
    timeTaken: "16 / 20",
    totalTime: "20 min",
    scoreSecured: 8,
    maxScore: 12,
    status: "Passed",
    percentage: 66.7,
    attemptedQuestions: 10,
    totalQuestions: 12,
    collegeRank: "1",
    overallRank: "4",
    integrityScore: 100,
    goodTopics: ["SELECT basics", "Filtering"],
    averageTopics: ["GROUP BY"],
    poorTopics: [],
    mcq: [
      {
        question: "Which clause filters rows before grouping?",
        topic: "Filtering",
        score: "1/1",
        status: "correct",
        userAnswer: "WHERE",
        correctAnswer: "WHERE",
      },
    ],
    coding: [],
    violations: [],
  },
};

export function getReportDetailByTestId(
  testId: string
): TestReportDetail | undefined {
  if (testId === MOCK_REPORT_DETAIL_TEST_12_5.test_id) {
    return MOCK_REPORT_DETAIL_TEST_12_5;
  }
  return undefined;
}

export function getStudentReportDetail(
  studentId: string
): StudentTestReportDetail | undefined {
  return MOCK_STUDENT_REPORTS[studentId];
}

export function filterReportList(cards: ReportListCard[], filters: {
  track: string;
  course: string;
  batch: string;
  subject: string;
  testType: string;
  liveOrCompleted: string;
}): ReportListCard[] {
  return cards.filter((card) => {
    if (filters.track && card.track !== filters.track) return false;
    if (filters.course && card.course !== filters.course) return false;
    if (filters.batch && card.batch !== filters.batch) return false;
    if (filters.subject && card.subject !== filters.subject) return false;
    if (filters.testType && card.test_type !== filters.testType) return false;
    if (
      filters.liveOrCompleted &&
      card.status !== filters.liveOrCompleted
    ) {
      return false;
    }
    return true;
  });
}

/** Legacy id used by completed-tests link */
export const MOCK_PERFORMANCE_REPORT_ID = MOCK_REPORT_DETAIL_TEST_12_5.test_id;
