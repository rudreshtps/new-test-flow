/** Assign Test to Batch — mock options */

import type { QuestionSelectionLogic } from "../types";
import {
  computeDurationFromLevelRules,
  computeDurationFromSelectionLogic,
} from "../utils/testDuration";
import { DEFAULT_LEVEL_RULES } from "../data/mockData";
import { CREATE_TEST_TYPES, type CreateTestType } from "./createTestConstants";

export type AssignListStatus = "assigned" | "unassigned" | "partial";

export type BatchAssignStatus = "draft" | "partial" | "scheduled";

export type TestBatchAssignment = {
  batch_id: string;
  batch_name: string;
  course_id: string;
  course_name: string;
  track_id: string;
  track_name: string;
  status: BatchAssignStatus;
  test_type: string | null;
  date: string | null;
  time: string | null;
  studentCount: number;
  assignedStudentIds?: string[];
  securitySaved: boolean;
  scheduleSaved: boolean;
};

export type AssignListTest = {
  id: string;
  name: string;
  subject: string;
  type: CreateTestType | string;
  marks: number;
  description: string;
  status: AssignListStatus;
  course?: string | null;
  batch?: string | null;
  date?: string | null;
  time?: string | null;
  assignedCount?: number;
  remainingCount?: number;
  track?: string;
  batches?: TestBatchAssignment[];
  /** Saved during assign — duration is derived from this, not set at create */
  selectionLogic?: QuestionSelectionLogic;
  selectionLogicSaved?: boolean;
  /** Subject / overall final tests use level rules instead of manual selection logic */
  levelRulesApplied?: boolean;
  /** Subject Final Test: assign enabled only when subject is marked complete in course */
  subjectCompleted?: boolean;
};

/**
 * Test names follow type-based naming conventions:
 *
 * Weekly Tests:       SQL  - 12M 2026 - WT001
 * Revision Tests:     SQL  - 12M 2026 - RT001
 * Practice Tests:     PT - 12M 2026 - 001 - SQL-Python-DSA
 *                     PT - FYP 2026 - 001 - SQL-Python-DSA
 * Subject Final Test: SQL  - 12M 2026 - FT001
 * Overall Test:       OT - 12M 2026 - 001 - SQL-Python-DSA
 * Employability Test: ET - May 2026 - 001 - SQL-Python-DSA
 */
export const MOCK_PT_12M_001_LOGIC: QuestionSelectionLogic = {
  subject: "SQL",
  topics: ["Query Fundamentals", "Joins & Relations"],
  subtopics: ["SELECT basics", "Filtering", "INNER JOIN"],
  subtopicRules: [
    {
      topic: "Query Fundamentals",
      subtopic: "SELECT basics",
      levelCounts: [
        { level: 1, mcqCount: 5, codingCount: 2 },
        { level: 2, mcqCount: 3, codingCount: 3 },
        { level: 3, mcqCount: 2, codingCount: 5 },
      ],
    },
  ],
};

export const MOCK_TESTS: AssignListTest[] = [
  {
    id: "PT-12M-001",
    name: "PT - 12M 2026 - 001 - SQL",
    subject: "SQL",
    type: "Practice Test",
    marks: 50,
    description: "Practice test for SQL — 12M 2026 batch.",
    status: "assigned",
    selectionLogic: MOCK_PT_12M_001_LOGIC,
    selectionLogicSaved: true,
    course: "12M 2026",
    batch: "Batch-01",
    date: "2026-07-10",
    time: "09:00",
    assignedCount: 5,
    remainingCount: 0,
    track: "IT",
    batches: [
      {
        batch_id: "b01",
        batch_name: "Batch-01",
        course_id: "c-12m",
        course_name: "12M 2026",
        track_id: "it",
        track_name: "IT",
        status: "scheduled",
        test_type: "Practice Test",
        date: "2026-07-10",
        time: "09:00",
        studentCount: 2,
        assignedStudentIds: ["STU-001", "STU-002"],
        securitySaved: true,
        scheduleSaved: true,
      },
      {
        batch_id: "b02",
        batch_name: "B02",
        course_id: "c-example",
        course_name: "Example course",
        track_id: "it",
        track_name: "IT",
        status: "scheduled",
        test_type: "Practice Test",
        // Same date+time as Batch-01 → shared question set
        date: "2026-07-10",
        time: "09:00",
        studentCount: 3,
        assignedStudentIds: ["STU-006", "STU-007", "STU-008"],
        securitySaved: true,
        scheduleSaved: true,
      },
    ],
  },
  {
    id: "RT001",
    name: "SQL  - 12M 2026 - RT001",
    subject: "SQL",
    type: "Revision Test",
    marks: 40,
    description: "Revision test for SQL — 12M 2026 batch.",
    status: "unassigned",
    course: "12M 2026",
    track: "IT",
    batches: [],
  },
  {
    id: "PT-12M-002",
    name: "PT - 12M 2026 - 002 - SQL-Python-DSA",
    subject: "SQL-Python-DSA",
    type: "Practice Test",
    marks: 100,
    description: "Practice test covering SQL, Python and DSA.",
    status: "unassigned",
    course: "12M 2026",
    track: "IT",
    batches: [],
  },
  {
    id: "PT-FYP-001",
    name: "PT - FYP 2026 - 001 - SQL-Python-DSA",
    subject: "SQL-Python-DSA",
    type: "Practice Test",
    marks: 100,
    description: "Practice test for FYP 2026 — SQL, Python and DSA.",
    status: "partial",
    course: "FYP 2026",
    batch: "Batch-04",
    date: "2026-07-12",
    time: "14:00",
    assignedCount: 3,
    remainingCount: 2,
    track: "IT",
    batches: [
      {
        batch_id: "b04",
        batch_name: "Batch-04",
        course_id: "c-fyp",
        course_name: "FYP 2026",
        track_id: "it",
        track_name: "IT",
        status: "partial",
        test_type: "Practice Test",
        date: "2026-07-12",
        time: "14:00",
        studentCount: 3,
        securitySaved: true,
        scheduleSaved: true,
      },
      {
        batch_id: "mrit-2026",
        batch_name: "MRIT 2026",
        course_id: "c-mrit",
        course_name: "MRIT Excellence 12 months Full Stack Course",
        track_id: "it",
        track_name: "IT",
        status: "draft",
        test_type: null,
        date: null,
        time: null,
        studentCount: 0,
        securitySaved: false,
        scheduleSaved: false,
      },
    ],
  },
  {
    id: "FT001",
    name: "SQL  - 12M 2026 - FT001",
    subject: "SQL",
    type: "Subject Final Test",
    marks: 100,
    description: "Subject final test for SQL — auto-generated from level rules at assign.",
    status: "unassigned",
    course: "12M 2026",
    track: "IT",
    subjectCompleted: true,
    batches: [],
  },
  {
    id: "OT-12M-002",
    name: "OT - 12M 2026 - 002 - SQL-Python-DSA",
    subject: "SQL-Python-DSA",
    type: "Overall Test",
    marks: 100,
    description: "Overall final test — auto-generated from level rules at assign.",
    status: "unassigned",
    course: "12M 2026",
    track: "IT",
    subjectCompleted: true,
    batches: [],
  },
  {
    id: "OT-12M-001",
    name: "OT - 12M 2026 - 001 - SQL-Python-DSA",
    subject: "SQL-Python-DSA",
    type: "Overall Test",
    marks: 100,
    description: "Overall test covering SQL, Python and DSA.",
    status: "assigned",
    course: "12M 2026",
    batch: "Batch-06",
    date: "2026-07-08",
    time: "10:30",
    assignedCount: 8,
    remainingCount: 0,
    track: "IT",
    batches: [
      {
        batch_id: "b06",
        batch_name: "Batch-06",
        course_id: "c-12m",
        course_name: "12M 2026",
        track_id: "it",
        track_name: "IT",
        status: "scheduled",
        test_type: "Overall Test",
        date: "2026-07-08",
        time: "10:30",
        studentCount: 8,
        securitySaved: true,
        scheduleSaved: true,
      },
    ],
  },
  {
    id: "ET-MAY-001",
    name: "ET - May 2026 - 001 - SQL-Python-DSA",
    subject: "SQL-Python-DSA",
    type: "Employability Test",
    marks: 100,
    description: "Employability / bootcamp test — May 2026.",
    status: "unassigned",
    course: "May 2026",
    track: "IT",
    batches: [],
  },
];

export const TRACK_OPTIONS = [
  { id: "it", name: "IT" },
  { id: "aptitude", name: "Aptitude" },
  { id: "fullstack", name: "Full Stack" },
];

export const COURSES_BY_TRACK_ID: Record<
  string,
  { id: string; name: string }[]
> = {
  it: [
    { id: "c-12m", name: "12M 2026" },
    { id: "c-fyp", name: "FYP 2026" },
    {
      id: "c-mrit",
      name: "MRIT Excellence 12 months Full Stack Course",
    },
    { id: "c-example", name: "Example course" },
  ],
  aptitude: [{ id: "c-apt", name: "Aptitude Course" }],
  fullstack: [{ id: "c-fs", name: "Full Stack Course" }],
};

export const BATCHES_BY_COURSE_ID: Record<
  string,
  { id: string; name: string }[]
> = {
  "c-12m": [
    { id: "b01", name: "Batch-01" },
    { id: "b02", name: "B02" },
    { id: "b03", name: "Batch-03" },
  ],
  "c-fyp": [
    { id: "b04", name: "Batch-04" },
    { id: "b05", name: "Batch-05" },
  ],
  "c-mrit": [{ id: "mrit-2026", name: "MRIT 2026" }],
  "c-example": [{ id: "b02", name: "B02" }],
  "c-apt": [{ id: "b-apt-1", name: "Aptitude Batch-01" }],
  "c-fs": [{ id: "b-fs-1", name: "FS Batch-01" }],
};

export const ASSIGN_STATUS_FILTERS = [
  { value: "all", label: "All Tests" },
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned" },
  { value: "partial", label: "Partially Assigned" },
] as const;

export const ASSIGN_TYPE_FILTERS = [
  { value: "", label: "All Types" },
  ...CREATE_TEST_TYPES.map((t) => ({ value: t, label: t })),
];

export const ASSIGN_COURSES = [
  "12M 2026",
  "FYP 2026",
  "May 2026",
  "Aptitude",
  "Core Programming",
  "Database",
  "Web Development",
];

export const BATCHES_BY_COURSE: Record<string, string[]> = {
  "12M 2026": ["Batch-01", "Batch-02", "Batch-03"],
  "FYP 2026": ["Batch-04", "Batch-05"],
  "May 2026": ["Batch-09"],
  Aptitude: ["Batch-01", "Batch-02"],
  "Core Programming": ["Batch-04", "Batch-05"],
  Database: ["Batch-06", "Batch-07"],
  "Web Development": ["Batch-08"],
};

export type BatchStudent = {
  id: string;
  name: string;
  college: string;
  branch: string;
  assigned: boolean;
  testTaken: boolean;
  /** Marked absent — cannot be assigned to final test */
  absent?: boolean;
  /** Auto-marked absent: not present within 25% of test duration */
  autoAbsent25?: boolean;
  /** Subjects for which this student already completed a final test */
  finalTestCompletedSubjects?: string[];
  /** Subjects for which this student attempted a final test (incl. in progress) */
  attemptedFinalSubjects?: string[];
};

export const STUDENTS_BY_BATCH: Record<string, BatchStudent[]> = {
  "Batch-01": [
    {
      id: "STU-001",
      name: "Aarav Sharma",
      college: "IIT Delhi",
      branch: "CSE",
      assigned: true,
      testTaken: true,
      finalTestCompletedSubjects: ["Python"],
    },
    {
      id: "STU-002",
      name: "Priya Nair",
      college: "NIT Trichy",
      branch: "IT",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-003",
      name: "Rohan Mehta",
      college: "BITS Pilani",
      branch: "CSE",
      assigned: false,
      testTaken: false,
      absent: true,
    },
    {
      id: "STU-004",
      name: "Sneha Reddy",
      college: "IIIT Hyderabad",
      branch: "CSE",
      assigned: false,
      testTaken: false,
      autoAbsent25: true,
    },
    {
      id: "STU-005",
      name: "Karan Singh",
      college: "DTU",
      branch: "ECE",
      assigned: false,
      testTaken: false,
      finalTestCompletedSubjects: ["SQL"],
    },
  ],
  "Batch-02": [
    {
      id: "STU-006",
      name: "Ananya Patel",
      college: "VIT",
      branch: "CSE",
      assigned: false,
      testTaken: false,
    },
    {
      id: "STU-007",
      name: "Vikram Joshi",
      college: "Manipal",
      branch: "IT",
      assigned: false,
      testTaken: false,
    },
  ],
  "Batch-03": [
    {
      id: "STU-008",
      name: "Meera Iyer",
      college: "SRM",
      branch: "CSE",
      assigned: false,
      testTaken: false,
    },
  ],
  "Batch-04": [
    {
      id: "STU-009",
      name: "Dev Patel",
      college: "NITK",
      branch: "CSE",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-010",
      name: "Riya Kapoor",
      college: "PICT",
      branch: "IT",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-011",
      name: "Arjun Das",
      college: "MIT",
      branch: "CSE",
      assigned: false,
      testTaken: false,
    },
  ],
  "Batch-06": [
    {
      id: "STU-012",
      name: "Neha Verma",
      college: "NSIT",
      branch: "CSE",
      assigned: true,
      testTaken: true,
    },
  ],
  B02: [
    {
      id: "STU-006",
      name: "Ananya Patel",
      college: "VIT",
      branch: "CSE",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-007",
      name: "Vikram Joshi",
      college: "Manipal",
      branch: "IT",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-008",
      name: "Meera Iyer",
      college: "SRM",
      branch: "CSE",
      assigned: true,
      testTaken: false,
    },
    {
      id: "STU-013",
      name: "Rahul Gupta",
      college: "DTU",
      branch: "CSE",
      assigned: false,
      testTaken: false,
    },
    {
      id: "STU-014",
      name: "Sana Khan",
      college: "AMU",
      branch: "IT",
      assigned: false,
      testTaken: false,
    },
  ],
};

export function getStudentsForBatch(batchName: string): BatchStudent[] {
  return STUDENTS_BY_BATCH[batchName] ?? [];
}

export function getEligibleStudentsForAssign(
  batchName: string,
  subject: string,
  isFinalTestFlow: boolean
): BatchStudent[] {
  const pool = getStudentsForBatch(batchName);
  if (!isFinalTestFlow) return pool;
  return pool.filter(
    (student) =>
      !student.absent &&
      !student.autoAbsent25 &&
      !(student.finalTestCompletedSubjects ?? []).includes(subject)
  );
}

export function getStudentAssignBlockReason(
  student: BatchStudent,
  subject: string,
  isFinalTestFlow: boolean
): string | null {
  if (!isFinalTestFlow) return null;
  if (student.absent) return "Absent — cannot assign final test";
  if (student.autoAbsent25) {
    return "Auto-absent (not present within 25% of test duration)";
  }
  if ((student.finalTestCompletedSubjects ?? []).includes(subject)) {
    return `Already completed final test for ${subject}`;
  }
  return null;
}

export function getAssignedStudentIds(
  batches: TestBatchAssignment[]
): string[] {
  const ids = new Set<string>();
  batches.forEach((b) => {
    b.assignedStudentIds?.forEach((id) => ids.add(id));
  });
  return [...ids];
}

export function allAssignedStudentsAttemptedFinal(
  batches: TestBatchAssignment[],
  subject: string
): boolean {
  const ids = getAssignedStudentIds(batches);
  if (ids.length === 0) return false;

  return ids.every((id) => {
    for (const batch of batches) {
      const pool = getStudentsForBatch(batch.batch_name);
      const student = pool.find((s) => s.id === id);
      if (!student) continue;
      if (student.absent || student.autoAbsent25) return true;
      return (student.attemptedFinalSubjects ?? []).includes(subject);
    }
    return false;
  });
}

export function getInitialAssignedIds(
  batch: TestBatchAssignment
): string[] {
  if (batch.assignedStudentIds?.length) return [...batch.assignedStudentIds];
  const pool = getStudentsForBatch(batch.batch_name);
  return pool.filter((s) => s.assigned).map((s) => s.id);
}

export function getTestDuration(test: AssignListTest): number | null {
  if (test.type === "Subject Final Test") {
    return test.levelRulesApplied
      ? computeDurationFromLevelRules(DEFAULT_LEVEL_RULES)
      : null;
  }

  if (test.selectionLogicSaved && test.selectionLogic) {
    const minutes = computeDurationFromSelectionLogic(test.selectionLogic);
    return minutes > 0 ? minutes : null;
  }

  return null;
}

export function getTestById(id: string): AssignListTest | undefined {
  return MOCK_TESTS.find((t) => t.id === id);
}

export function formatAssignDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return `${date.getDate()}-${date.getMonth() + 1}-${date
    .getFullYear()
    .toString()
    .slice(-2)}`;
}

export function formatAssignTime(timeStr: string | null | undefined) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
}
