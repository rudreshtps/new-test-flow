export type GradeBand = {
  band: "SUN" | "MOON" | "STAR" | "REST";
  percent: number;
  count: number;
};

export type TestReportRow = {
  id: string;
  testName: string;
  courseName: string;
  batchName: string;
  subjectName: string;
  status: "Generated" | "Emailed";
  totalStudents: number;
  studentsAttended: number;
  studentsAbsent: number;
  passPercent: number;
  failPercent: number;
  grades: GradeBand[];
};

export const MOCK_TEST_REPORTS: TestReportRow[] = [
  {
    id: "rpt-1",
    testName: "SQL  - FYP 2026 - FT001",
    courseName: "FYP 2026",
    batchName: "Batch-04",
    subjectName: "SQL",
    status: "Generated",
    totalStudents: 30,
    studentsAttended: 28,
    studentsAbsent: 2,
    passPercent: 85,
    failPercent: 15,
    grades: [
      { band: "SUN", percent: 25, count: 7 },
      { band: "MOON", percent: 35, count: 10 },
      { band: "STAR", percent: 25, count: 7 },
      { band: "REST", percent: 15, count: 4 },
    ],
  },
];

export type TriggeredTestRow = {
  id: string;
  testName: string;
  trainerName: string;
  scheduledDate: string;
  scheduledTime: string;
  triggerDate: string | null;
  triggerTime: string | null;
  status: "Scheduled" | "Live" | "Completed";
  course: string;
  batch: string;
};

export type CompletedTestRow = {
  id: string;
  testName: string;
  assignedDate: string;
  assignedTime: string;
  durationMinutes: number;
  course: string;
  batch: string;
  studentsAttempted: string;
  absentCount: number;
  unassignedCount: number;
  trainerName: string;
  proctoringViolations: number;
  mcqCount: number;
  codingCount: number;
  difficulty: string;
  topicsCovered: string;
};

export const MOCK_TRIGGERED_TESTS: TriggeredTestRow[] = [
  {
    id: "trg-1",
    testName: "SQL  - 12M 2026 - FT001",
    trainerName: "Ravi Kumar",
    scheduledDate: "2026-07-12",
    scheduledTime: "09:00",
    triggerDate: null,
    triggerTime: null,
    status: "Scheduled",
    course: "12M 2026",
    batch: "Batch-01",
  },
  {
    id: "trg-2",
    testName: "Python  - 12M 2026 - FT001",
    trainerName: "Anita Desai",
    scheduledDate: "2026-07-08",
    scheduledTime: "14:00",
    triggerDate: "2026-07-08",
    triggerTime: "14:12",
    status: "Live",
    course: "12M 2026",
    batch: "Batch-03",
  },
];

export const MOCK_COMPLETED_TESTS: CompletedTestRow[] = [
  {
    id: "cmp-1",
    testName: "SQL  - FYP 2026 - FT001",
    assignedDate: "2026-06-28",
    assignedTime: "10:00",
    durationMinutes: 120,
    course: "FYP 2026",
    batch: "Batch-04",
    studentsAttempted: "28/30",
    absentCount: 2,
    unassignedCount: 0,
    trainerName: "Ravi Kumar",
    proctoringViolations: 3,
    mcqCount: 12,
    codingCount: 8,
    difficulty: "Mixed (L1–L3)",
    topicsCovered: "Query Fundamentals, Joins, Advanced SQL",
  },
];
