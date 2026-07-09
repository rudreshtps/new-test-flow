import React from "react";
import { BsClock } from "react-icons/bs";
import { LuCalendarDays } from "react-icons/lu";

type TestCardScheduleProps = {
  dateLabel?: string | null;
  timeLabel?: string | null;
};

const TestCardSchedule: React.FC<TestCardScheduleProps> = ({
  dateLabel,
  timeLabel,
}) => {
  if (!dateLabel && !timeLabel) return null;

  return (
    <div className="d-flex flex-column gap-1 text-secondary flex-shrink-0 lh-sm">
      {dateLabel && (
        <div className="d-flex align-items-center">
          <LuCalendarDays size={16} className="me-1" />
          <span className="fw-semibold text-nowrap">{dateLabel}</span>
        </div>
      )}
      {timeLabel && (
        <div className="d-flex align-items-center">
          <BsClock size={16} className="me-1" />
          <span className="fw-semibold text-nowrap">{timeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default TestCardSchedule;
