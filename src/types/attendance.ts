export type AttendanceStudentRecord = {
  id: string;
  name: string;
  college: string;
  branch: string;
  attendanceStatus: "Present" | "Absent" | "Pending";
  remark: string;
  autoAbsent25?: boolean;
};

export type AttendanceGroup = {
  id: string;
  name: string;
  correctImageId: string;
  imageLabel: string;
  imageSrc: string;
  studentCount: number;
};

export type AttendanceSession = {
  id: string;
  testName: string;
  trainerName: string;
  course: string;
  batch: string;
  durationMinutes: number;
  launchedAt: string;
  attendanceWindowMinutes: number;
  attendanceWindowRemaining: number;
  imageTimerSeconds: number;
  imageTimerActive: boolean;
  groups: AttendanceGroup[];
  groupSizes: number[];
  students: AttendanceStudentRecord[];
  headCount: number | null;
  roundNo: number;
};

export type AttendanceLaunchContext = {
  id: string;
  testName: string;
  trainerName: string;
  course: string;
  batch: string;
  batchNames: string[];
  durationMinutes: number;
  totalStudents: number;
};
