/** Report types aligned with LMS-Admin-Flow-Frontend testTypes */

export type ReportStudentDisplayStatus =
  | "Assigned"
  | "Absent"
  | "In Progress"
  | "Completed"
  | "Aborted"
  | "Terminated";

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
  display_status?: ReportStudentDisplayStatus;
  session_status?: string | null;
  Test_status?: string;
  test_start_time?: string;
};

export type ReportData = {
  status: string;
  test_id: string;
  title: string;
  description: string;
  duration: string;
  marks: number;
  subject: string | null;
  date: string | null;
  time: string | null;
  track: string | null;
  course: string | null;
  test_type: string | null;
  invited: number;
  from_time: string | null;
  end_time: string | null;
  batch?: string | null;
};

export type TestReportViewData = {
  test_name: string;
  course_name: string;
  batch_name: string;
  batch_id?: string | null;
  test_status: string;
  exam_control_status?: string;
  test_start_time: string;
  test_end_time: string;
  duration: string;
  test_marks: number;
  test_type: string;
  auto_release_test_report: boolean;
  report_released: boolean;
  report: ReportStudentRow[];
};

export type LiveProctoringEventItem = {
  id: string;
  student_id: string;
  student_name?: string;
  event: string;
  severity: string;
  event_at?: string;
  detail?: string;
  violation_count?: number;
  violation_penalty_percent?: number;
  violation_action?: string;
  test_terminated?: boolean;
};

export type LiveProctoringStudentItem = {
  student_id: string;
  student_name?: string;
  session_id?: number;
  session_status?: string | null;
  violation_count: number;
  violation_penalty_percent: number;
  score_retention_percent: number;
  proctoring_violated: boolean;
  event_counters: Record<string, number>;
  latest_event_at?: string;
  latest_event_type?: string;
};

export type LiveProctoringFeed = {
  test_id: string;
  events: LiveProctoringEventItem[];
  students: LiveProctoringStudentItem[];
  active_sessions: number;
  violated_students: number;
  students_with_violations?: number;
  total_violation_events: number;
  max_violation_attempts?: number;
  latest_event_at?: string;
  fetched_at?: string;
  live_feed_active?: boolean;
};
