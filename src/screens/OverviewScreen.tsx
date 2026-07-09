import { Link } from "react-router-dom";
import { Badge, Col, Row } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";

const FEATURES = [
  {
    step: "1–2",
    title: "Two-Step Test Flow",
    desc: "Create Test (metadata) → Assign landing lists Unassigned & Previously Assigned tests → open a card to assign / configure questions.",
    routes: ["/create-test", "/assign-test"],
    tag: "Core",
  },
  {
    step: "2",
    title: "Level-wise Rules",
    desc: "Configure and apply per-level rules (question count, marks, pass %) for Subject Final Tests during assignment.",
    routes: ["/level-rules", "/assign-test"],
    tag: "Assign",
  },
  {
    step: "2",
    title: "Time-based Question Sets",
    desc: "Question sets auto-generated from scheduled start time (morning / afternoon / evening slots).",
    routes: ["/time-question-sets", "/assign-test"],
    tag: "Assign",
  },
  {
    step: "Live",
    title: "Question Swap",
    desc: "Replace a question for a student while the test is in progress.",
    routes: ["/question-swap", "/live-monitor"],
    tag: "Live",
  },
  {
    step: "Live",
    title: "Change Test Duration",
    desc: "Modify total test duration after the test has started.",
    routes: ["/change-duration", "/live-monitor"],
    tag: "Live",
  },
  {
    step: "Live",
    title: "Attendance Relaxation",
    desc: "Mark attendance up to 25% of total test duration after test begins.",
    routes: ["/attendance", "/live-monitor"],
    tag: "Live",
  },
];

export default function OverviewScreen() {
  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <Row className="g-3">
          {FEATURES.map((f) => (
            <Col key={f.title} xs={12} md={6}>
              <div className="p-3 bg-white rounded border border-light shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="fw-semibold">{f.title}</div>
                  <div className="d-flex gap-1">
                    <Badge bg="secondary">{f.step}</Badge>
                    <Badge bg="warning" text="dark">
                      {f.tag}
                    </Badge>
                  </div>
                </div>
                <p className="text-secondary small mb-2">{f.desc}</p>
                <div className="d-flex gap-2 flex-wrap">
                  {f.routes.map((r) => (
                    <Link key={r} to={r} className="text-primary small fw-semibold">
                      {r.replace("/", "")} →
                    </Link>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </TestPageShell>
  );
}
