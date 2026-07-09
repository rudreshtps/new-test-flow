/** Create Test page — tracks, courses, subjects, and test types */

export const CREATE_TEST_TRACKS = ["IT", "Aptitude", "Full Stack", "Data Science"] as const;

export const COURSES_BY_TRACK: Record<string, string[]> = {
  IT: ["12M 2026", "FYP 2026", "Aptitude", "Core Programming", "Database"],
  Aptitude: ["12M 2026", "Quantitative", "Logical Reasoning"],
  "Full Stack": ["12M 2026", "FYP 2026", "Frontend", "Backend"],
  "Data Science": ["12M 2026", "Statistics", "Machine Learning"],
};

export const CREATE_TEST_SUBJECTS = [
  "SQL",
  "Python",
  "DSA",
  "SQL-Python-DSA",
  "All",
  "Java",
  "JavaScript",
] as const;

export const CREATE_TEST_TYPES = [
  "Weekly Test",
  "Revision Test",
  "Practice Test",
  "Subject Final Test",
  "Overall Test",
  "Employability Test",
] as const;

export type CreateTestType = (typeof CREATE_TEST_TYPES)[number];

/** Naming prefixes by test type (from product naming convention) */
export const TEST_TYPE_NAME_PREFIX: Record<CreateTestType, string> = {
  "Weekly Test": "WT",
  "Revision Test": "RT",
  "Practice Test": "PT",
  "Subject Final Test": "FT",
  "Overall Test": "OT",
  "Employability Test": "ET",
};

/**
 * Subject-style names:  SQL  - 12M 2026 - WT001
 * Multi-subject names:  PT - 12M 2026 - 001 - SQL-Python-DSA
 * Employability may use month: ET - May 2026 - 001 - SQL-Python-DSA
 */
export function buildTestName(options: {
  type: CreateTestType | string;
  subject: string;
  courseCode?: string;
  seq?: number;
  periodLabel?: string;
}): string {
  const seq = options.seq ?? 1;
  const padded = String(seq).padStart(3, "0");
  const course = options.courseCode || "12M 2026";
  const type = options.type as CreateTestType;
  const prefix = TEST_TYPE_NAME_PREFIX[type] ?? "TT";

  if (type === "Weekly Test" || type === "Revision Test" || type === "Subject Final Test") {
    return `${options.subject}  - ${course} - ${prefix}${padded}`;
  }

  if (type === "Employability Test") {
    const period = options.periodLabel || "May 2026";
    return `${prefix} - ${period} - ${padded} - ${options.subject}`;
  }

  // Practice Test, Overall Test
  return `${prefix} - ${course} - ${padded} - ${options.subject}`;
}
