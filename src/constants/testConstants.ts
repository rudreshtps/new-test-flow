export const REPORT_STUDENT_STATUS = {
  ASSIGNED: "Assigned",
  ABSENT: "Absent",
  IN_PROGRESS: "In Progress",
  ABORTED: "Aborted",
  TERMINATED: "Terminated",
  COMPLETED: "Completed",
} as const;

/** All student statuses returned by ExskilenceLMSV2 resolve_student_test_display_status */
export const REPORT_STUDENT_STATUSES = Object.values(REPORT_STUDENT_STATUS);
