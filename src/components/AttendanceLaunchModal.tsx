import { useMemo, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import {
  MAX_GROUPS,
  computeGroupSplit,
} from "../data/attendanceMockData";

type AttendanceLaunchModalProps = {
  show: boolean;
  testName: string;
  batch: string;
  totalStudents: number;
  onHide: () => void;
  onLaunch: (groupSizes: number[]) => void;
};

export default function AttendanceLaunchModal({
  show,
  testName,
  batch,
  totalStudents,
  onHide,
  onLaunch,
}: AttendanceLaunchModalProps) {
  const [splitError, setSplitError] = useState("");

  const groupSizes = useMemo(
    () => (totalStudents > 0 ? computeGroupSplit(totalStudents) : []),
    [totalStudents]
  );

  const handleLaunch = () => {
    setSplitError("");

    if (totalStudents <= 0) {
      setSplitError("No students found for this batch.");
      return;
    }

    if (groupSizes.length > MAX_GROUPS) {
      setSplitError(
        `Cannot split ${totalStudents} students into at most ${MAX_GROUPS} groups (max 20 per group).`
      );
      return;
    }

    onLaunch(groupSizes);
  };

  return (
    <Modal show={show} onHide={onHide} centered className="test-flow-modal">
      <Modal.Header closeButton>
        <Modal.Title>Launch Attendance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="bg-light rounded p-3 mb-3 small">
          <div>
            <strong>Test:</strong> {testName}
          </div>
          <div>
            <strong>Batch:</strong> {batch}
          </div>
          <div>
            <strong>Students:</strong> {totalStudents}
          </div>
        </div>

        {splitError ? (
          <Alert variant="danger" className="mb-0 py-2 small">
            {splitError}
          </Alert>
        ) : (
          <>
            <p className="mb-2">
              <strong>{totalStudents}</strong> students will be split into{" "}
              <strong>{groupSizes.length}</strong> group
              {groupSizes.length !== 1 ? "s" : ""} (max 20 per group):
            </p>
            <p className="text-muted mb-0 small">
              {groupSizes.map((size, index) => `Group ${index + 1}: ${size}`).join(" · ")}
            </p>
            <Alert variant="info" className="py-2 small mt-3 mb-0">
              After launch, show each group its shape token. Then provision students as
              Present or Absent within the 25% attendance window.
            </Alert>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleLaunch}
          disabled={!!splitError || groupSizes.length === 0}
        >
          Generate Groups &amp; Launch
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
