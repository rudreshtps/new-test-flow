import React from "react";
import { LuCalendarDays } from "react-icons/lu";
import { BsClock } from "react-icons/bs";

const SCHEDULE_ICON_WIDTH = 18;

type TestCardScheduleProps = {
  dateLabel?: string | null;
  timeLabel?: string | null;
};

const TestCardSchedule: React.FC<TestCardScheduleProps> = ({
  dateLabel,
  timeLabel,
}) => {
  if (!dateLabel && !timeLabel) {
    return null;
  }

  return (
    <div className="d-flex flex-column gap-1 text-secondary flex-shrink-0 lh-sm">
      {dateLabel && (
        <div className="d-flex align-items-center">
          <span
            className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: SCHEDULE_ICON_WIDTH }}
          >
            <LuCalendarDays size={16} />
          </span>
          <span className="fw-semibold text-nowrap">{dateLabel}</span>
        </div>
      )}
      {timeLabel && (
        <div className="d-flex align-items-center">
          <span
            className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: SCHEDULE_ICON_WIDTH }}
          >
            <BsClock
              size={16}
              style={{
                display: "inline-block",
                fontSize: "1.2em",
                lineHeight: 1,
                verticalAlign: "middle",
                flexShrink: 0,
              }}
            />
          </span>
          <span className="fw-semibold text-nowrap">{timeLabel}</span>
        </div>
      )}
    </div>
  );
};

export default TestCardSchedule;
