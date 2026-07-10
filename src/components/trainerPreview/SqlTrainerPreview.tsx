import { useEffect, useState } from "react";
import AceEditor from "../../utils/aceEditor";
import type { StudentSqlQuestion } from "../../data/studentFlowQuestionAdapter";
import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-dreamweaver";

type SqlTrainerPreviewProps = {
  question: StudentSqlQuestion;
};

export default function SqlTrainerPreview({ question }: SqlTrainerPreviewProps) {
  const [sqlQuery, setSqlQuery] = useState(question.Template);
  const [activeTab, setActiveTab] = useState<"table" | "output">("table");
  const [selectedTable, setSelectedTable] = useState(question.Table);
  const [tableData, setTableData] = useState<Record<string, string | number>[]>(
    question.Tables[0]?.data ?? []
  );
  const [processing, setProcessing] = useState(false);
  const [runResponseTable, setRunResponseTable] = useState<Record<string, string | number>[]>(
    []
  );
  const [runResponseTestCases, setRunResponseTestCases] = useState<Record<string, string>[]>(
    []
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");

  const tableNames = question.Table.split(",").map((name) => name.trim());

  useEffect(() => {
    setSqlQuery(question.Template);
    setActiveTab("table");
    setSelectedTable(question.Table);
    setTableData(question.Tables[0]?.data ?? []);
    setRunResponseTable([]);
    setRunResponseTestCases([]);
    setSuccessMessage("");
    setAdditionalMessage("");
  }, [question]);

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    const match = question.Tables.find(
      (table) => table.tab_name.toLowerCase() === tableName.toLowerCase()
    );
    setTableData(match?.data ?? []);
  };

  const handleRun = async () => {
    setProcessing(true);
    setSuccessMessage("");
    setAdditionalMessage("");
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    const normalized = sqlQuery.trim().toUpperCase();
    const looksValid =
      normalized.includes("SELECT") && normalized.includes("FROM") && sqlQuery.trim().length > 20;

    if (!looksValid) {
      setRunResponseTable([{ error: "Incomplete SQL — include SELECT and FROM clauses." }]);
      setRunResponseTestCases([
        { Testcase1: "Failed" },
        { Testcase2: "Failed" },
      ]);
      setSuccessMessage("Error");
      setAdditionalMessage("Fix the query and run again.");
    } else {
      setRunResponseTable(question.ExpectedOutput);
      setRunResponseTestCases([
        { Testcase1: "Passed" },
        { Testcase2: looksValid ? "Passed" : "Failed" },
      ]);
      setSuccessMessage("Success");
      setAdditionalMessage("Mock execution — verify output matches expected result.");
    }

    setProcessing(false);
  };

  return (
    <div className="d-flex trainer-preview-shell" style={{ width: "100%" }}>
      <div
        className="bg-white"
        style={{
          width: "45%",
          display: "flex",
          flexDirection: "column",
          marginRight: "10px",
          flexShrink: 0,
        }}
      >
        <div style={{ height: "45%", backgroundColor: "#E5E5E533" }}>
          <div className="p-3" style={{ height: "100%", overflowY: "auto" }}>
            <p className="small text-muted mb-1">Question ID: {question.question_id}</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {question.Qn}
            </pre>
          </div>
        </div>

        <div
          style={{
            height: "55%",
            backgroundColor: "#E5E5E533",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ul className="custom-tabs mt-2 mb-2 mx-3 nav nav-pills" style={{ fontSize: "12px" }}>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link me-2 ${activeTab === "table" ? "active" : ""}`}
                onClick={() => setActiveTab("table")}
                style={{
                  boxShadow: "#888 1px 2px 5px 0px",
                  backgroundColor: activeTab === "table" ? "black" : "transparent",
                  color: activeTab === "table" ? "white" : "black",
                }}
              >
                Table
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "output" ? "active" : ""}`}
                onClick={() => setActiveTab("output")}
                style={{
                  boxShadow: "#888 1px 2px 5px 0px",
                  backgroundColor: activeTab === "output" ? "black" : "transparent",
                  color: activeTab === "output" ? "white" : "black",
                }}
              >
                Expected Output
              </button>
            </li>
          </ul>

          <div className="tab-content flex-grow-1 overflow-hidden d-flex flex-column">
            {activeTab === "table" && (
              <div className="ms-3 flex-grow-1 overflow-hidden d-flex flex-column">
                <ul className="nav nav-pills" style={{ fontSize: "12px" }}>
                  {tableNames.map((tableName) => (
                    <li key={tableName} className="nav-item">
                      <button
                        type="button"
                        className={`nav-link me-2 custom-tab ${
                          selectedTable === tableName ? "active" : ""
                        }`}
                        onClick={() => handleTableClick(tableName)}
                      >
                        {tableName}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="table-responsive flex-grow-1 mt-2">
                  {tableData.length > 0 && (
                    <table className="table table-bordered table-sm" style={{ fontSize: "12px" }}>
                      <thead>
                        <tr>
                          {Object.keys(tableData[0]).map((header) => (
                            <th key={header} className="text-center">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={index}>
                            {Object.keys(row).map((header) => (
                              <td key={header} className="text-center">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === "output" && (
              <div className="ms-3 flex-grow-1 overflow-auto">
                {question.ExpectedOutput.length > 0 && (
                  <table className="table table-bordered table-sm" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        {Object.keys(question.ExpectedOutput[0]).map((header) => (
                          <th key={header} className="text-center">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {question.ExpectedOutput.map((row, index) => (
                        <tr key={index}>
                          {Object.keys(row).map((header) => (
                            <td key={header} className="text-center">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <div style={{ height: "45%", backgroundColor: "#E5E5E533", padding: "10px" }}>
          <AceEditor
            mode="sql"
            theme="dreamweaver"
            value={sqlQuery}
            onChange={setSqlQuery}
            fontSize={14}
            placeholder="Write all SQL commands/clauses in UPPERCASE"
            showPrintMargin={false}
            showGutter={false}
            highlightActiveLine={false}
            wrapEnabled
            style={{ width: "100%", height: "100%" }}
            setOptions={{ useWorker: false }}
          />
        </div>

        <div
          style={{ height: "6%", backgroundColor: "#E5E5E533" }}
          className="d-flex align-items-center processingDivStyle px-2"
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
            disabled={processing || !sqlQuery.trim()}
          >
            RUN CODE
          </button>
        </div>

        <div style={{ height: "49%", backgroundColor: "#E5E5E533" }} className="p-3 overflow-auto">
          {runResponseTable.length > 0 && runResponseTable[0].error ? (
            <div className="alert alert-danger small mb-3">
              <strong>Error:</strong> {String(runResponseTable[0].error)}
            </div>
          ) : (
            runResponseTable.length > 0 && (
              <table className="table table-bordered table-sm mb-3" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    {Object.keys(runResponseTable[0]).map((header) => (
                      <th key={header} className="text-center">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runResponseTable.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(row).map((header) => (
                        <td key={header} className="text-center">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {runResponseTestCases.map((testCase, index) => (
            <div
              key={index}
              className="d-flex align-items-center mb-2 border shadow-sm bg-white p-2 rounded-2"
              style={{ width: "fit-content", fontSize: "12px" }}
            >
              <span className="me-2">{Object.keys(testCase)[0]}:</span>
              <span
                style={{
                  color:
                    Object.values(testCase)[0] === "Passed" ? "blue" : "red",
                }}
              >
                {Object.values(testCase)[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
