import type { Question } from "../types";
import { getQuestionById } from "./questionBank";

export type StudentMcqQuestion = {
  Qn_name: string;
  question: string;
  options: string[];
  correct_answer: string;
  Explanation?: string;
  score: string;
  entered_ans: string;
  status: boolean;
  level: string;
  question_id?: string;
  topic_name?: string;
  subtopic_name?: string;
};

export type StudentSqlQuestion = {
  Qn_name: string;
  Qn: string;
  Template: string;
  Table: string;
  Tables: { tab_name: string; data: Record<string, string | number>[] }[];
  ExpectedOutput: Record<string, string | number>[];
  TestCases: Record<string, string>[];
  question_id?: string;
  topic_name?: string;
  subtopic_name?: string;
  level?: string;
};

export type StudentPythonQuestion = {
  Qn_name: string;
  Qn: string;
  Template: string;
  Examples: {
    Example: {
      Inputs: string[];
      Output: string;
      Explanation: string;
    };
  }[];
  TestCases: {
    Testcase: {
      Value: string[];
      Output: string;
    };
  }[];
  question_id?: string;
  topic_name?: string;
  subtopic_name?: string;
  level?: string;
};

const DEFAULT_EMPLOYEES_TABLE = {
  tab_name: "employees",
  data: [
    { id: 1, name: "Alice", department: "Engineering", manager_id: 10 },
    { id: 2, name: "Bob", department: "Engineering", manager_id: 10 },
    { id: 3, name: "Carol", department: "Sales", manager_id: 20 },
    { id: 4, name: "Dave", department: "Sales", manager_id: 20 },
  ],
};

const MCQ_OVERRIDES: Record<
  string,
  { stem: string; options: string[]; correct_answer: string; explanation: string }
> = {
  "SQL-L1-01": {
    stem: "Write a SELECT statement to list all columns from the employees table.",
    options: [
      "SELECT employees FROM *",
      "SELECT * FROM employees",
      "GET * FROM employees",
      "LIST ALL employees",
    ],
    correct_answer: "SELECT * FROM employees",
    explanation:
      "SELECT * returns every column from the employees table. The FROM clause names the table.",
  },
  "SQL-L1-02": {
    stem: "Filter orders placed in the last 30 days using WHERE.",
    options: [
      "WHERE order_date >= CURRENT_DATE - INTERVAL 30 DAY",
      "HAVING order_date >= CURRENT_DATE - 30",
      "FILTER order_date LAST 30 DAYS",
      "WHERE order_date = LAST_30_DAYS()",
    ],
    correct_answer: "WHERE order_date >= CURRENT_DATE - INTERVAL 30 DAY",
    explanation: "WHERE filters rows before aggregation. HAVING applies after GROUP BY.",
  },
};

function hashPick(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return hash % modulo;
}

function buildMcqOptions(question: Question): {
  options: string[];
  correct_answer: string;
  explanation: string;
} {
  const override = MCQ_OVERRIDES[question.id];
  if (override) {
    return {
      options: override.options,
      correct_answer: override.correct_answer,
      explanation: override.explanation,
    };
  }

  const correctIndex = hashPick(question.id, 4);
  const options = ["A", "B", "C", "D"].map((label, index) =>
    index === correctIndex
      ? `Correct answer for ${question.subtopic} (Level ${question.level})`
      : `Distractor ${label} — ${question.subtopic}`
  );

  return {
    options,
    correct_answer: options[correctIndex],
    explanation: `Review ${question.subtopic} at Level ${question.level}.`,
  };
}

export function buildStudentMcqQuestion(questionId: string): StudentMcqQuestion | null {
  const question = getQuestionById(questionId);
  if (!question || question.type !== "MCQ") return null;

  const { options, correct_answer, explanation } = buildMcqOptions(question);
  const override = MCQ_OVERRIDES[question.id];

  return {
    Qn_name: question.id,
    question_id: question.id,
    question: override?.stem ?? question.text,
    options,
    correct_answer,
    Explanation: explanation,
    score: `${question.marks}/${question.marks}`,
    entered_ans: "",
    status: false,
    level: String(question.level),
    topic_name: question.topic,
    subtopic_name: question.subtopic,
  };
}

export function buildStudentSqlQuestion(questionId: string): StudentSqlQuestion | null {
  const question = getQuestionById(questionId);
  if (!question || question.type !== "Coding" || question.subject !== "SQL") return null;

  const isOverride = question.id === "SQL-L2-02";
  const problem = isOverride
    ? "Write a SQL query to find employees who report to the same manager.\nReturn employee names in alphabetical order."
    : `${question.text}\n\nSubject: ${question.subject} · Topic: ${question.topic} · Subtopic: ${question.subtopic}`;

  return {
    Qn_name: question.id,
    question_id: question.id,
    Qn: problem,
    Template: isOverride
      ? "SELECT e1.name AS employee, e2.name AS colleague\nFROM employees e1\nJOIN employees e2\n  ON e1.manager_id = e2.manager_id\n AND e1.id < e2.id\nORDER BY e1.name;"
      : `-- ${question.subtopic}\nSELECT \nFROM employees\nWHERE \n;`,
    Table: "employees",
    Tables: [DEFAULT_EMPLOYEES_TABLE],
    ExpectedOutput: isOverride
      ? [
          { employee: "Alice", colleague: "Bob" },
          { employee: "Carol", colleague: "Dave" },
        ]
      : [
          { id: 1, name: "Alice", department: "Engineering" },
          { id: 2, name: "Bob", department: "Engineering" },
        ],
    TestCases: [{ Testcase1: "Pending" }, { Testcase2: "Pending" }],
    topic_name: question.topic,
    subtopic_name: question.subtopic,
    level: String(question.level),
  };
}

export function buildStudentPythonQuestion(questionId: string): StudentPythonQuestion | null {
  const question = getQuestionById(questionId);
  if (!question || question.type !== "Coding" || question.subject === "SQL") return null;

  return {
    Qn_name: question.id,
    question_id: question.id,
    Qn: `${question.text}\n\nWrite a program for ${question.subtopic} (Level ${question.level}).`,
    Template: `# ${question.subtopic}\ndef solve(a, b):\n    return a + b\n\nif __name__ == "__main__":\n    print(solve(5, 3))\n`,
    Examples: [
      {
        Example: {
          Inputs: ["5", "3"],
          Output: "8",
          Explanation: `Add the two numbers for ${question.subtopic}.`,
        },
      },
    ],
    TestCases: [
      { Testcase: { Value: ["5", "3"], Output: "8" } },
      { Testcase: { Value: ["0", "0"], Output: "0" } },
    ],
    topic_name: question.topic,
    subtopic_name: question.subtopic,
    level: String(question.level),
  };
}

export function getStudentEditorKind(
  questionId: string
): "mcq" | "sql" | "python" | null {
  const question = getQuestionById(questionId);
  if (!question) return null;
  if (question.type === "MCQ") return "mcq";
  if (question.subject === "SQL") return "sql";
  return "python";
}
