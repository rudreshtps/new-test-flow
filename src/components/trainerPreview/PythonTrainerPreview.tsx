import { useEffect, useState } from "react";
import AceEditor from "../../utils/aceEditor";
import type { StudentPythonQuestion } from "../../data/studentFlowQuestionAdapter";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-dreamweaver";

type PythonTrainerPreviewProps = {
  question: StudentPythonQuestion;
};

type RunTestCase = {
  id: string;
  passed: boolean;
};

export default function PythonTrainerPreview({ question }: PythonTrainerPreviewProps) {
  const [code, setCode] = useState(question.Template);
  const [processing, setProcessing] = useState(false);
  const [output, setOutput] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [activeSection, setActiveSection] = useState<"output" | "testcases">("output");
  const [runResponseTestCases, setRunResponseTestCases] = useState<RunTestCase[]>([]);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number | null>(null);

  useEffect(() => {
    setCode(question.Template);
    setOutput("");
    setSuccessMessage("");
    setAdditionalMessage("");
    setRunResponseTestCases([]);
    setSelectedTestCaseIndex(null);
    setActiveSection("output");
  }, [question]);

  const handleRun = async () => {
    setProcessing(true);
    setSuccessMessage("");
    setAdditionalMessage("");
    await new Promise((resolve) => window.setTimeout(resolve, 600));

    const looksValid = code.trim().length > 30 && !code.includes("pass\n");
    const sampleOutput = question.Examples[0]?.Example.Output ?? "8";

    if (!looksValid) {
      setOutput("Execution failed: incomplete solution.");
      setRunResponseTestCases([
        { id: "TestCase1", passed: false },
        { id: "TestCase2", passed: false },
        { id: "Result", passed: false },
      ]);
      setSuccessMessage("Error");
      setAdditionalMessage("Complete the logic before running.");
    } else {
      setOutput(`Program finished.\nOutput:\n${sampleOutput}`);
      setRunResponseTestCases([
        { id: "TestCase1", passed: true },
        { id: "TestCase2", passed: true },
        { id: "Result", passed: true },
      ]);
      setSuccessMessage("Success");
      setAdditionalMessage("Mock execution — review stdout and hidden cases.");
      setSelectedTestCaseIndex(1);
    }

    setActiveSection("testcases");
    setProcessing(false);
  };

  return (
    <div className="d-flex trainer-preview-shell" style={{ width: "100%" }}>
      <div
        style={{
          width: "40%",
          flexShrink: 0,
          marginRight: "10px",
          backgroundColor: "#E5E5E533",
          overflow: "auto",
        }}
      >
        <div className="p-3">
          <div className="d-flex flex-row justify-content-end mb-2">
            <span className="p-2 fs-6 rounded-2 bg-primary-subtle d-flex flex-column small">
              <span>Topic: {question.topic_name}</span>
              <span>Sub topic: {question.subtopic_name}</span>
              <span>QID: {question.question_id}</span>
            </span>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{question.Qn}</pre>

          {question.Examples.length > 0 && (
            <div className="mt-4">
              <h6 className="fw-bold">Examples:</h6>
              {question.Examples.map((example, index) => (
                <div
                  key={index}
                  className="mb-3 p-3 border rounded"
                  style={{ backgroundColor: "#f8f9fa", fontSize: "13px" }}
                >
                  <div className="mb-2">
                    <strong>Example {index + 1}:</strong>
                  </div>
                  <div className="mb-2">
                    <span className="text-muted">Input: </span>
                    {example.Example.Inputs.join(", ")}
                  </div>
                  <div className="mb-2">
                    <span className="text-muted">Output: </span>
                    {example.Example.Output}
                  </div>
                  <div>
                    <span className="text-muted">Explanation: </span>
                    {example.Example.Explanation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <div style={{ height: "45%", backgroundColor: "#E5E5E533" }}>
          <AceEditor
            mode="python"
            theme="dreamweaver"
            value={code}
            onChange={setCode}
            fontSize={14}
            showPrintMargin={false}
            wrapEnabled
            style={{ width: "95%", height: "calc(100% - 20px)", margin: "15px" }}
            setOptions={{ useWorker: false }}
          />
        </div>

        <div
          style={{ height: "6%", backgroundColor: "#E5E5E533" }}
          className="d-flex align-items-center px-2"
        >
          <div className="flex-grow-1">
            {processing ? (
              <h6 className="m-0">Processing...</h6>
            ) : (
              <>
                {successMessage && (
                  <h6 className="m-0" style={{ fontSize: "14px" }}>
                    {successMessage}
                  </h6>
                )}
                {additionalMessage && (
                  <p className="m-0 text-muted" style={{ fontSize: "10px" }}>
                    {additionalMessage}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light processingDivButton"
            onClick={() => void handleRun()}
            disabled={processing || !code.trim()}
          >
            RUN CODE
          </button>
        </div>

        <div style={{ height: "48%", backgroundColor: "#E5E5E533" }} className="p-3 d-flex flex-column">
          <div className="d-flex mb-3">
            <button
              type="button"
              className={`btn ${activeSection === "output" ? "btn-primary" : "btn-outline-primary"} me-2`}
              style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => setActiveSection("output")}
            >
              Output
            </button>
            <button
              type="button"
              className={`btn ${activeSection === "testcases" ? "btn-primary" : "btn-outline-primary"}`}
              style={{ fontSize: "12px", padding: "6px 12px" }}
              onClick={() => setActiveSection("testcases")}
            >
              Test Cases
            </button>
          </div>

          {activeSection === "output" && (
            <pre
              className="flex-grow-1 m-0 p-2 border rounded bg-light overflow-auto"
              style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}
            >
              {output || "Run code to see output."}
            </pre>
          )}

          {activeSection === "testcases" && runResponseTestCases.length > 0 && (
            <div className="d-flex flex-grow-1 overflow-hidden">
              <div className="border-end pe-2" style={{ width: "25%", overflowY: "auto" }}>
                {runResponseTestCases.map((testCase, index) => (
                  <button
                    key={testCase.id}
                    type="button"
                    className={`w-100 text-start btn btn-sm mb-2 ${
                      selectedTestCaseIndex === index ? "btn-primary" : "btn-light"
                    }`}
                    onClick={() => setSelectedTestCaseIndex(index)}
                  >
                    {testCase.id} {testCase.passed ? "✓" : "✗"}
                  </button>
                ))}
              </div>
              <div className="ps-3 flex-grow-1 overflow-auto small">
                {selectedTestCaseIndex !== null && (
                  <>
                    <div className="mb-2">
                      <strong>Status: </strong>
                      <span
                        className={
                          runResponseTestCases[selectedTestCaseIndex].passed
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {runResponseTestCases[selectedTestCaseIndex].passed
                          ? "Passed"
                          : "Failed"}
                      </span>
                    </div>
                    {question.TestCases[selectedTestCaseIndex] && (
                      <>
                        <div className="mb-2">
                          <strong>Input:</strong>
                          <pre className="bg-light p-2 rounded mt-1">
                            {question.TestCases[selectedTestCaseIndex].Testcase.Value.join(
                              ", "
                            )}
                          </pre>
                        </div>
                        <div>
                          <strong>Expected Output:</strong>
                          <pre className="bg-light p-2 rounded mt-1">
                            {question.TestCases[selectedTestCaseIndex].Testcase.Output}
                          </pre>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
