import { STUDENTS_BY_BATCH } from "../constants/assignTestConstants";
import { ATTENDANCE_IMAGES } from "./attendanceImages";
import type {
  AttendanceGroup,
  AttendanceLaunchContext,
  AttendanceSession,
  AttendanceStudentRecord,
} from "../types/attendance";
import type { TriggeredTestRow } from "./sftMockData";

const SESSIONS_KEY = "test-attendance-sessions";

export const MAX_GROUPS = 10;
export const MAX_STUDENTS_PER_GROUP = 20;
export const MIN_GROUPS = 3;
export const DEFAULT_IMAGE_TIMER_SECONDS = 15;
export const IMAGE_EXTEND_SECONDS = 15;
export const WINDOW_EXTEND_MINUTES = 5;

export const ABSENT_REMARKS = [
  "SELECTED WRONG IMAGE",
  "CAME LATE",
  "INTERNET PROBLEM",
  "NOT IN CLASS",
];

function loadSessions(): Record<string, AttendanceSession> {
  try {
    const raw = sessionStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AttendanceSession>) : {};
  } catch {
    return {};
  }
}

function saveSessions(sessions: Record<string, AttendanceSession>) {
  sessionStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function computeGroupSplit(
  totalStudents: number,
  maxPerGroup = MAX_STUDENTS_PER_GROUP,
  minGroups = MIN_GROUPS
): number[] {
  if (totalStudents <= 0) return [];

  const neededForCap = Math.ceil(totalStudents / maxPerGroup);
  const groupCount = Math.min(MAX_GROUPS, Math.max(minGroups, neededForCap));
  const base = Math.floor(totalStudents / groupCount);
  const remainder = totalStudents % groupCount;
  const smallerGroupCount = groupCount - remainder;

  return Array.from({ length: groupCount }, (_, index) =>
    index < smallerGroupCount ? base : base + 1
  );
}

export function generateAttendanceGroups(groupSizes: number[]): AttendanceGroup[] {
  const shuffledImages = [...ATTENDANCE_IMAGES].sort(() => Math.random() - 0.5);

  return groupSizes.map((studentCount, index) => {
    const image = shuffledImages[index % shuffledImages.length];
    return {
      id: `group-${index + 1}`,
      name: `Group ${index + 1}`,
      correctImageId: image.id,
      imageLabel: image.label,
      imageSrc: image.src,
      studentCount,
    };
  });
}

function normalizeAttendanceGroup(
  group: AttendanceGroup & Record<string, unknown>,
  index: number
): AttendanceGroup {
  if (group.imageSrc && group.correctImageId) {
    return group;
  }

  const legacyShape = String(group.shapeLabel ?? "").toLowerCase();
  const matched =
    ATTENDANCE_IMAGES.find((image) => legacyShape.includes(image.id)) ??
    ATTENDANCE_IMAGES[index % ATTENDANCE_IMAGES.length];

  return {
    id: group.id,
    name: group.name,
    correctImageId: matched.id,
    imageLabel: matched.label,
    imageSrc: matched.src,
    studentCount: group.studentCount,
  };
}

export function normalizeAttendanceSession(session: AttendanceSession): AttendanceSession {
  return {
    ...session,
    groups: session.groups.map((group, index) =>
      normalizeAttendanceGroup(group as AttendanceGroup & Record<string, unknown>, index)
    ),
  };
}

export function buildStudentsForBatch(batch: string): AttendanceStudentRecord[] {
  return (STUDENTS_BY_BATCH[batch] ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    college: student.college,
    branch: student.branch,
    attendanceStatus: student.absent || student.autoAbsent25 ? "Absent" : "Pending",
    remark:
      student.autoAbsent25
        ? "AUTO ABSENT (25% WINDOW)"
        : student.absent
          ? "MARKED ABSENT"
          : "",
    autoAbsent25: student.autoAbsent25,
  }));
}

export function buildStudentsForBatches(
  batches: string[]
): AttendanceStudentRecord[] {
  const seen = new Set<string>();
  return batches
    .flatMap((batch) => buildStudentsForBatch(batch))
    .filter((student) => {
      if (seen.has(student.id)) return false;
      seen.add(student.id);
      return true;
    });
}

export function getStudentCountForBatch(batch: string): number {
  return (STUDENTS_BY_BATCH[batch] ?? []).length;
}

export function getStudentCountForBatches(batches: string[]): number {
  return buildStudentsForBatches(batches).length;
}

export function createAttendanceSession(
  context: AttendanceLaunchContext,
  groupSizes: number[]
): AttendanceSession {
  const attendanceWindowMinutes = Math.max(
    1,
    Math.round(context.durationMinutes * 0.25)
  );

  const session: AttendanceSession = {
    id: context.id,
    testName: context.testName,
    trainerName: context.trainerName,
    course: context.course,
    batch: context.batch,
    durationMinutes: context.durationMinutes,
    launchedAt: new Date().toISOString(),
    attendanceWindowMinutes,
    attendanceWindowRemaining: attendanceWindowMinutes,
    imageTimerSeconds: DEFAULT_IMAGE_TIMER_SECONDS,
    imageTimerActive: true,
    groups: generateAttendanceGroups(groupSizes),
    groupSizes,
    students: buildStudentsForBatches(context.batchNames),
    headCount: null,
    roundNo: 1,
  };

  const sessions = loadSessions();
  sessions[session.id] = session;
  saveSessions(sessions);
  return session;
}

export function loadAttendanceSession(sessionId: string): AttendanceSession | null {
  const session = loadSessions()[sessionId];
  return session ? normalizeAttendanceSession(session) : null;
}

export function saveAttendanceSession(session: AttendanceSession) {
  const sessions = loadSessions();
  sessions[session.id] = session;
  saveSessions(sessions);
}

export function toLaunchContext(row: TriggeredTestRow): AttendanceLaunchContext {
  return {
    id: row.id,
    testName: row.testName,
    trainerName: row.trainerName,
    course: row.course,
    batch: row.batch,
    batchNames: [row.batch],
    durationMinutes: row.durationMinutes,
    totalStudents: getStudentCountForBatch(row.batch),
  };
}

export function getAttendanceSummary(students: AttendanceStudentRecord[]) {
  const present = students.filter((s) => s.attendanceStatus === "Present").length;
  const absent = students.filter((s) => s.attendanceStatus === "Absent").length;
  const pending = students.filter((s) => s.attendanceStatus === "Pending").length;
  const total = students.length || 1;
  return {
    present,
    absent,
    pending,
    presentPercent: Math.round((present / total) * 100),
    absentPercent: Math.round((absent / total) * 100),
    pendingPercent: Math.round((pending / total) * 100),
  };
}

export function autoCloseAttendanceWindow(session: AttendanceSession): AttendanceSession {
  const students = session.students.map((student) => {
    if (student.attendanceStatus !== "Pending") return student;
    return {
      ...student,
      attendanceStatus: "Absent" as const,
      autoAbsent25: true,
      remark: "AUTO ABSENT (25% WINDOW)",
    };
  });

  return {
    ...session,
    attendanceWindowRemaining: 0,
    students,
  };
}
