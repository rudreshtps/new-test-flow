import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
import MultiSelect from "../components/MultiSelect";
import TestPageShell from "../components/TestPageShell";
import {
  COURSES_BY_TRACK,
  CREATE_TEST_SUBJECTS,
  CREATE_TEST_TRACKS,
  CREATE_TEST_TYPES,
  buildTestName,
  type CreateTestType,
} from "../constants/createTestConstants";

const CreateTestForm = () => {
  const navigate = useNavigate();
  const [track, setTrack] = useState("IT");
  const [courses, setCourses] = useState<string[]>(["12M 2026"]);
  const [subject, setSubject] = useState("SQL");
  const [testType, setTestType] = useState<CreateTestType>("Weekly Test");
  const [loading, setLoading] = useState(false);

  const courseOptions = COURSES_BY_TRACK[track] ?? [];

  useEffect(() => {
    setCourses((prev) => {
      const next = prev.filter((c) => courseOptions.includes(c));
      if (next.length > 0) return next;
      return courseOptions[0] ? [courseOptions[0]] : [];
    });
  }, [track, courseOptions]);

  const isSubjectFinalPlaceholder = testType === "Subject Final Test";
  const isOverallFinalPlaceholder = testType === "Overall Test";
  const isCoursePlaceholder = isSubjectFinalPlaceholder || isOverallFinalPlaceholder;

  const previewName = useMemo(() => {
    if (isSubjectFinalPlaceholder) {
      const courseCode = courses[0] || "12M 2026";
      return `${subject}  - ${courseCode} - FT###`;
    }
    if (isOverallFinalPlaceholder) {
      const courseCode = courses[0] || "12M 2026";
      const subjectForName =
        subject === "SQL" || subject === "Python" || subject === "DSA"
          ? "SQL-Python-DSA"
          : subject;
      return `OT - ${courseCode} - ### - ${subjectForName}`;
    }

    const courseCode = courses[0] || "12M 2026";
    const subjectForName =
      testType === "Practice Test" ||
      testType === "Employability Test"
        ? subject === "SQL" || subject === "Python" || subject === "DSA"
          ? "SQL-Python-DSA"
          : subject
        : subject;

    return buildTestName({
      type: testType,
      subject: subjectForName,
      courseCode:
        testType === "Employability Test" ? undefined : courseCode,
      periodLabel: testType === "Employability Test" ? "May 2026" : undefined,
      seq: 1,
    });
  }, [courses, subject, testType, isSubjectFinalPlaceholder, isOverallFinalPlaceholder]);

  const handleCreateTest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!track || courses.length === 0 || !subject || !testType) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/assign-test");
    }, 400);
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="card shadow-sm flex-grow-1 border-0">
        <div className="card-body p-2">
          <Form onSubmit={handleCreateTest}>
            <Row className="g-2">
              <Col xs={12} sm={6} lg={3}>
                <Form.Group controlId="track">
                  <Form.Label className="fw-semibold">
                    Select &apos;Track&apos; *
                  </Form.Label>
                  <Form.Select
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    required
                  >
                    {CREATE_TEST_TRACKS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Group controlId="course">
                  <Form.Label className="fw-semibold">Select Course *</Form.Label>
                  <MultiSelect
                    options={courseOptions.map((c) => ({ value: c, label: c }))}
                    value={courses}
                    onChange={setCourses}
                    placeholder="Select course(s)"
                    disabled={!track}
                  />
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Group controlId="subject">
                  <Form.Label className="fw-semibold">
                    Select &apos;Subject&apos; *
                  </Form.Label>
                  <Form.Select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  >
                    {CREATE_TEST_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} lg={3}>
                <Form.Group controlId="testType">
                  <Form.Label className="fw-semibold">
                    Select &apos;Type&apos; *
                  </Form.Label>
                  <Form.Select
                    value={testType}
                    onChange={(e) =>
                      setTestType(e.target.value as CreateTestType)
                    }
                    required
                  >
                    {CREATE_TEST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 p-2 bg-light rounded border">
              <div className="text-muted small mb-1">
                {isCoursePlaceholder
                  ? "Course placeholder name (system assigns FT001/OT001… at first assign)"
                  : "Auto-generated test name (based on type)"}
              </div>
              <div className="fw-semibold">{previewName}</div>
              {isCoursePlaceholder && (
                <div className="text-muted small mt-2">
                  Questions and level rules are applied only when this test is
                  assigned to batches. Trainers cannot edit the name.
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end border-top pt-3 mt-3">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="btn btn-sm px-4"
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : isCoursePlaceholder ? (
                  "Add Placeholder to Course"
                ) : (
                  "Create Test"
                )}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default function CreateTestScreen() {
  return (
    <TestPageShell showCardSearch={false}>
      <div
        className="overflow-auto px-4 py-3"
        style={{ height: "calc(100vh - 150px)" }}
      >
        <CreateTestForm />
      </div>
    </TestPageShell>
  );
}
