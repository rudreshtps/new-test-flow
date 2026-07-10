import type {
  ReportData,
  ReportStudentDisplayStatus,
  ReportStudentRow,
  TestReportViewData,
} from "../test/types";

const CLEAR_CUTOFF_PERCENT = 40;

export type ReportDetailStats = {
  totalStudents: number;
  appeared: number;
  cleared: number;
  failed: number;
  avgScore: number;
};

export type ReportStudentSortField =
  | "ID"
  | "Student"
  | "College"
  | "Branch"
  | "Category"
  | "display_status"
  | "Max_marks"
  | "Obtained_marks"
  | "Percentage"
  | "final_percent"
  | "Rank";

export function resolveReportStudentDisplayStatus(
  row: ReportStudentRow,
  _testEndTime?: string
): ReportStudentDisplayStatus {
  if (
    row.display_status &&
    [
      "Assigned",
      "Absent",
      "In Progress",
      "Completed",
      "Aborted",
      "Terminated",
    ].includes(row.display_status)
  ) {
    return row.display_status;
  }
  return "Assigned";
}

export function computeReportDetailStats(
  rows: ReportStudentRow[] | undefined,
  testEndTime?: string,
  testOver = false
): ReportDetailStats {
  if (!rows?.length) {
    return { totalStudents: 0, appeared: 0, cleared: 0, failed: 0, avgScore: 0 };
  }

  let appeared = 0;
  let cleared = 0;
  let failed = 0;
  const percentages: number[] = [];

  for (const row of rows) {
    const displayStatus = resolveReportStudentDisplayStatus(row, testEndTime);
    const notAppeared =
      displayStatus === "Assigned" || displayStatus === "Absent";
    if (!notAppeared) appeared += 1;

    if (testOver && displayStatus === "Absent") {
      failed += 1;
      continue;
    }

    const hasFinalResult =
      displayStatus === "Completed" ||
      displayStatus === "Terminated" ||
      displayStatus === "Aborted";
    const hasPercentage =
      row.Percentage !== null &&
      row.Percentage !== undefined &&
      !Number.isNaN(row.Percentage);

    if (hasFinalResult && hasPercentage && row.Percentage !== null) {
      if (row.Percentage >= CLEAR_CUTOFF_PERCENT) cleared += 1;
      else failed += 1;
      percentages.push(row.Percentage);
    }
  }

  const avgScore = percentages.length
    ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
    : 0;

  return {
    totalStudents: rows.length,
    appeared,
    cleared,
    failed,
    avgScore,
  };
}

export function isReportStudentAssigned(student: ReportStudentRow): boolean {
  return resolveReportStudentDisplayStatus(student) === "Assigned";
}

export function formatObtainedValue(student: ReportStudentRow): string {
  if (isReportStudentAssigned(student)) return "--";
  const hasObtained = student.Obtained_marks !== null;
  const hasPercentage = student.Percentage !== null;
  if (!hasObtained && !hasPercentage) return "--";
  if (hasObtained && hasPercentage && student.Percentage !== null) {
    return `${student.Obtained_marks} (${Number(student.Percentage.toFixed(1))}%)`;
  }
  if (hasObtained) return String(student.Obtained_marks);
  return `(${Number(student.Percentage!.toFixed(1))}%)`;
}

export function getReportFinalScoreMarks(student: ReportStudentRow): number | null {
  if (student.Obtained_marks === null) return null;
  const integrity = student.score_retention_percent ?? 100;
  return Number(((student.Obtained_marks * integrity) / 100).toFixed(2));
}

export function getReportFinalScorePercent(
  student: ReportStudentRow
): number | null {
  if (student.Percentage === null) return null;
  const integrity = student.score_retention_percent ?? 100;
  return Number(((student.Percentage * integrity) / 100).toFixed(1));
}

export function formatFinalScoreValue(student: ReportStudentRow): string {
  if (isReportStudentAssigned(student)) return "--";
  const marks = getReportFinalScoreMarks(student);
  const percent = getReportFinalScorePercent(student);
  if (marks === null && percent === null) return "--";
  if (marks !== null && percent !== null) {
    return `${marks} (${percent}%)`;
  }
  if (marks !== null) return String(marks);
  return `(${percent}%)`;
}

export function getReportStudentStatusStyle(
  status: ReportStudentDisplayStatus
): { backgroundColor: string; color: string } {
  switch (status) {
    case "Completed":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "In Progress":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    case "Assigned":
      return { backgroundColor: "#f1f5f9", color: "#475569" };
    case "Absent":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "Aborted":
      return { backgroundColor: "#ffedd5", color: "#9a3412" };
    case "Terminated":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return { backgroundColor: "#f1f5f9", color: "#475569" };
  }
}

export function resolveLiveProctoringSessionStatus(
  sessionStatus?: string | null
): ReportStudentDisplayStatus {
  const raw = (sessionStatus ?? "").trim().toLowerCase();
  if (raw === "violated") return "Terminated";
  if (raw === "completed") return "Completed";
  if (raw === "active") return "In Progress";
  if (raw === "aborted") return "Aborted";
  if (raw === "absent") return "Absent";
  return "Assigned";
}

export function formatReportTimeRange(card: {
  from_time: string | null;
  end_time: string | null;
  time?: string | null;
}): string | null {
  if (!card.from_time) return card.time?.trim() || null;
  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, "0")}:${m.padStart(2, "0")} ${ampm}`;
  };
  if (card.end_time) {
    return `${formatTime(card.from_time)} - ${formatTime(card.end_time)}`;
  }
  return formatTime(card.from_time);
}

export function getReportCardDate(
  report: ReportData | { date: string | null }
): string | null {
  if (!report.date) return null;
  const d = new Date(report.date);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear().toString().slice(-2)}`;
}

export function matchesVisibleCardSearch(
  visibleText: string,
  cardSearchQuery: string
): boolean {
  if (!cardSearchQuery) return true;
  return visibleText.toLowerCase().includes(cardSearchQuery.toLowerCase());
}

export function getVisibleReportSearchText(report: ReportData): string {
  const durationLabel = parseInt(report.duration, 10) === 1 ? "Minute" : "Minutes";
  return [
    report.title,
    report.subject,
    report.batch,
    report.description,
    report.duration,
    durationLabel,
    report.marks != null ? String(report.marks) : "",
    "Marks",
    report.invited != null ? String(report.invited) : "",
    "invited",
    getReportCardDate(report) ?? "",
    formatReportTimeRange(report) ?? "",
  ]
    .filter((v) => v != null && v !== "")
    .join(" ");
}

export function sortReportDetailRows(
  rows: ReportStudentRow[],
  field: ReportStudentSortField,
  direction: "asc" | "desc"
): ReportStudentRow[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    if (field === "final_percent") {
      const leftValue = getReportFinalScorePercent(left) ?? -1;
      const rightValue = getReportFinalScorePercent(right) ?? -1;
      return (leftValue - rightValue) * multiplier;
    }

    const sortField = field === "Obtained_marks" ? "Percentage" : field;
    const leftValue = left[sortField as keyof ReportStudentRow];
    const rightValue = right[sortField as keyof ReportStudentRow];

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * multiplier;
    }

    return (
      String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * multiplier
    );
  });
}

export function filterReportDetailRows(
  rows: ReportStudentRow[] | undefined,
  searchQuery: string
): ReportStudentRow[] {
  if (!rows) return [];
  const q = searchQuery.toLowerCase();
  return rows.filter(
    (student) =>
      student.ID.toLowerCase().includes(q) ||
      student.Student.toLowerCase().includes(q) ||
      student.College.toLowerCase().includes(q) ||
      student.Branch.toLowerCase().includes(q) ||
      student.Category.toLowerCase().includes(q)
  );
}

export function downloadTestReportCsv(
  rows: ReportStudentRow[],
  testReportView: TestReportViewData
): void {
  if (!rows.length) return;

  const headers = [
    "ID",
    "Student",
    "College",
    "Branch",
    "Category",
    "Status",
    "Max Marks",
    "Obtained",
    "Final Score",
  ];

  if (testReportView.test_type === "Final Test") {
    headers.push("Rank");
  }

  const csvContent = [
    headers.join(","),
    ...rows.map((student) => {
      const row = [
        student.ID,
        student.Student,
        student.College,
        student.Branch,
        student.Category,
        resolveReportStudentDisplayStatus(student, testReportView.test_end_time),
        String(student.Max_marks ?? "--"),
        formatObtainedValue(student),
        formatFinalScoreValue(student),
      ];
      if (testReportView.test_type === "Final Test") {
        row.push(String(student.Rank || "--"));
      }
      return row.join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${testReportView.test_name.replace(/\s+/g, "_")}_report.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
