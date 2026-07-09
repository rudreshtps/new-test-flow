import { useState } from "react";
import { Badge, Button, Form, Table } from "react-bootstrap";
import TestPageShell from "../components/TestPageShell";
import { DEFAULT_LEVEL_RULES } from "../data/mockData";
import type { LevelRule } from "../types";

export default function LevelRulesScreen() {
  const [rules, setRules] = useState<LevelRule[]>(DEFAULT_LEVEL_RULES);
  const [subject, setSubject] = useState("Data Structures");

  const updateRule = (level: number, field: keyof LevelRule, value: string | number) => {
    setRules((prev) =>
      prev.map((r) => (r.level === level ? { ...r, [field]: value } : r))
    );
  };

  const totalQuestions = rules.reduce((s, r) => s + r.questionCount, 0);
  const totalMarks = rules.reduce((s, r) => s + r.questionCount * r.marksPerQuestion, 0);

  return (
    <TestPageShell>
      <div className="overflow-auto px-4 py-3" style={{ height: "calc(100vh - 150px)" }}>
        <div className="d-flex gap-3 mb-3 flex-wrap">
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{rules.length}</div>
            <div className="text-secondary small">Levels</div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{totalQuestions}</div>
            <div className="text-secondary small">Total questions</div>
          </div>
          <div className="p-3 bg-light rounded border flex-fill">
            <div className="fs-4 fw-bold">{totalMarks}</div>
            <div className="text-secondary small">Total marks</div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body p-2">
            <div className="row g-2">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Subject</Form.Label>
                  <Form.Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option>Data Structures</option>
                    <option>DBMS</option>
                    <option>Operating Systems</option>
                    <option>Networks</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Applies to</Form.Label>
                  <Form.Control value="Subject Final Test" disabled />
                </Form.Group>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Level Rules — {subject}</span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm">
                + Add Level
              </Button>
              <Button variant="primary" size="sm">
                Save Rules
              </Button>
            </div>
          </div>
          <div className="card-body p-0">
            <Table responsive className="mb-0 test-sticky-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Label</th>
                  <th>Questions</th>
                  <th>Marks/Q</th>
                  <th>Pass %</th>
                  <th>Difficulty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.level}>
                    <td>
                      <Badge bg="primary">L{rule.level}</Badge>
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        value={rule.label}
                        onChange={(e) => updateRule(rule.level, "label", e.target.value)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={rule.questionCount}
                        onChange={(e) =>
                          updateRule(rule.level, "questionCount", Number(e.target.value))
                        }
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={rule.marksPerQuestion}
                        onChange={(e) =>
                          updateRule(rule.level, "marksPerQuestion", Number(e.target.value))
                        }
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={rule.passingPercent}
                        onChange={(e) =>
                          updateRule(rule.level, "passingPercent", Number(e.target.value))
                        }
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={rule.difficulty}
                        onChange={(e) =>
                          updateRule(
                            rule.level,
                            "difficulty",
                            e.target.value as LevelRule["difficulty"]
                          )
                        }
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </Form.Select>
                    </td>
                    <td className="fw-semibold">
                      {rule.questionCount * rule.marksPerQuestion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </TestPageShell>
  );
}
