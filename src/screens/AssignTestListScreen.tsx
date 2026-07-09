import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button } from "react-bootstrap";
import { BsClock } from "react-icons/bs";
import { GiStarShuriken } from "react-icons/gi";
import { TiGroupOutline } from "react-icons/ti";
import { VscListFlat } from "react-icons/vsc";
import TestCardSchedule from "../components/TestCardSchedule";
import TestFilterSelect from "../components/TestFilterSelect";
import TestPageShell from "../components/TestPageShell";
import {
  ASSIGN_TYPE_FILTERS,
  MOCK_TESTS,
  formatAssignDate,
  formatAssignTime,
  type AssignListStatus,
  type AssignListTest,
} from "../constants/assignTestConstants";
import { CREATE_TEST_TRACKS } from "../constants/createTestConstants";

const metaIconStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: "1.2em",
  lineHeight: 1,
  verticalAlign: "middle",
  flexShrink: 0,
};

type StatusFilter = "all" | AssignListStatus;

const statusBadge = (status: AssignListStatus) => {
  if (status === "assigned") return <Badge bg="success">Assigned</Badge>;
  if (status === "partial")
    return (
      <Badge bg="warning" text="dark">
        Partially Assigned
      </Badge>
    );
  return <Badge bg="secondary">Unassigned</Badge>;
};

function AssignTestList() {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredTests = useMemo(() => {
    return MOCK_TESTS.filter((test) => {
      if (selectedTrack && test.track !== selectedTrack) return false;
      if (selectedType && test.type !== selectedType) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "assigned")
        return test.status === "assigned" || test.status === "partial";
      return test.status === statusFilter;
    });
  }, [selectedTrack, selectedType, statusFilter]);

  const unassignedCount = MOCK_TESTS.filter(
    (t) => t.status === "unassigned"
  ).length;
  const assignedCount = MOCK_TESTS.filter(
    (t) => t.status === "assigned" || t.status === "partial"
  ).length;

  const handleCardClick = (test: AssignListTest) => {
    navigate(`/assign-test/${test.id}`);
  };

  return (
    <>
      <div className="d-flex gap-2 mb-2 flex-wrap px-1">
        <span className="badge text-bg-light border">
          Unassigned: <strong>{unassignedCount}</strong>
        </span>
        <span className="badge text-bg-light border">
          Assigned / Partial: <strong>{assignedCount}</strong>
        </span>
      </div>

      <div className="d-flex rounded-1 justify-content-start py-2 gap-2">
        <div
          className="col-3 filterSection flex-shrink-0"
          style={{
            height: "calc(100vh - 190px)",
            overflowY: "auto",
            minWidth: "200px",
          }}
        >
          <div
            className="border m-0 border-light p-3 px-4"
            style={{ boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}
          >
            <div className="d-flex flex-column gap-3">
              <TestFilterSelect
                label="Track"
                value={selectedTrack}
                onChange={setSelectedTrack}
                placeholder="All Tracks"
                options={CREATE_TEST_TRACKS.map((t) => ({
                  value: t,
                  label: t,
                }))}
                fullWidth
              />
              <TestFilterSelect
                label="Test Type"
                value={selectedType}
                onChange={setSelectedType}
                options={ASSIGN_TYPE_FILTERS.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                fullWidth
              />
              <TestFilterSelect
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
                options={[
                  { value: "all", label: "All Tests" },
                  { value: "unassigned", label: "Unassigned" },
                  { value: "assigned", label: "Assigned" },
                  { value: "partial", label: "Partially Assigned" },
                ]}
                fullWidth
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSelectedTrack("");
                  setSelectedType("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <div
          className="col filteredDataDisplaySection flex-grow-1 overflow-y-auto"
          style={{
            height: "calc(100vh - 190px)",
            overflowX: "hidden",
            paddingTop: "2px",
          }}
        >
          {filteredTests.length === 0 ? (
            <p className="text-muted ms-3 py-3 text-center">
              No tests match your filters.
            </p>
          ) : (
            filteredTests.map((test) => (
              <div
                key={test.id}
                role="button"
                tabIndex={0}
                className="mb-2 ms-2 p-2 bg-white rounded border border-light shadow-sm test-card-clickable"
                style={{ cursor: "pointer" }}
                onClick={() => handleCardClick(test)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(test);
                  }
                }}
              >
                <div className="d-flex align-items-start justify-content-between gap-2 pb-1 border-bottom">
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-0">
                      <span className="fw-semibold lh-sm">
                        {test.name || "Test Title"}
                      </span>
                      {statusBadge(test.status)}
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-1 text-secondary">
                      <span className="d-inline-flex align-items-center">
                        <VscListFlat className="me-1" />
                        {test.subject || "N/A"}
                      </span>
                      <span className="d-inline-flex align-items-center">
                        <BsClock className="me-1" style={metaIconStyle} />
                        {test.duration}{" "}
                        {test.duration === 1 ? "Minute" : "Minutes"}
                      </span>
                      <span className="d-inline-flex align-items-center">
                        <GiStarShuriken className="me-1" />
                        {test.marks} Marks
                      </span>
                    </div>
                  </div>
                  {(test.date || test.time) && (
                    <TestCardSchedule
                      dateLabel={formatAssignDate(test.date)}
                      timeLabel={formatAssignTime(test.time)}
                    />
                  )}
                </div>

                <div className="d-flex align-items-end gap-2 pt-1">
                  <div className="flex-grow-1 overflow-hidden">
                    {test.batch ? (
                      <div className="fs-6 mb-1">
                        <span className="fw-semibold">Batch:</span> {test.batch}
                        {test.course ? ` · ${test.course}` : ""}
                        {typeof test.assignedCount === "number" && (
                          <span className="text-secondary ms-2 small">
                            <TiGroupOutline className="me-1" />
                            {test.assignedCount} assigned
                            {typeof test.remainingCount === "number" &&
                            test.remainingCount > 0
                              ? ` · ${test.remainingCount} remaining`
                              : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="fs-6 mb-1 text-secondary">
                        Not assigned to any batch yet
                      </div>
                    )}
                    <div>
                      <span className="fw-semibold">Description</span>
                      <div className="text-dark lh-sm mt-1 text-break">
                        {test.description || "—"}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={
                      test.status === "unassigned"
                        ? "primary"
                        : "outline-primary"
                    }
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(test);
                    }}
                  >
                    {test.status === "unassigned"
                      ? "Assign"
                      : test.status === "partial"
                        ? "Assign Remaining"
                        : "Re-assign / View"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function AssignTestListScreen() {
  return (
    <TestPageShell showCardSearch>
      <div className="overflow-auto px-3 py-2" style={{ height: "calc(100vh - 150px)" }}>
        <AssignTestList />
      </div>
    </TestPageShell>
  );
}
