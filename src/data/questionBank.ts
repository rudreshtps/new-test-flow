import type { Question, SubtopicLevelCounts, SubtopicQuestionRule } from "../types";

export const QUESTION_LEVELS = [1, 2, 3] as const;

function normalizeLevelCounts(
  existing?: SubtopicQuestionRule
): SubtopicLevelCounts[] {
  if (existing?.levelCounts?.length) {
    return QUESTION_LEVELS.map((level) => {
      const match = existing.levelCounts.find((item) => item.level === level);
      return {
        level,
        mcqCount: match?.mcqCount ?? 0,
        codingCount: match?.codingCount ?? 0,
      };
    });
  }
  const legacy = existing as SubtopicQuestionRule & {
    mcqCount?: number;
    codingCount?: number;
  };
  return QUESTION_LEVELS.map((level) => ({
    level,
    mcqCount: level === 1 ? legacy?.mcqCount ?? 0 : 0,
    codingCount: level === 1 ? legacy?.codingCount ?? 0 : 0,
  }));
}

export function getRuleMcqTotal(rule: SubtopicQuestionRule): number {
  return rule.levelCounts.reduce((total, level) => total + level.mcqCount, 0);
}

export function getRuleCodingTotal(rule: SubtopicQuestionRule): number {
  return rule.levelCounts.reduce((total, level) => total + level.codingCount, 0);
}

export const SUBJECT_TOPIC_TREE: Record<string, Record<string, string[]>> = {
  SQL: {
    "Query Fundamentals": ["SELECT basics", "Filtering", "Sorting & GROUP BY"],
    "Joins & Relations": ["INNER JOIN", "OUTER JOIN", "Self JOIN"],
    "Advanced SQL": ["Subqueries", "Window Functions", "Indexing"],
  },
  "Data Structures": {
    Arrays: ["Traversal", "Two pointers", "Sliding window"],
    Trees: ["BST", "Traversal", "Balancing"],
    Graphs: ["BFS/DFS", "Shortest path", "Cycles"],
  },
  DBMS: {
    Modeling: ["ER diagrams", "Normalization", "Keys"],
    Transactions: ["ACID", "Isolation", "Deadlocks"],
    Indexing: ["B-Tree", "Hash index", "Query plans"],
  },
};

export const QUESTION_BANK: Question[] = [
  {
    id: "SQL-L1-01",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "SELECT basics",
    text: "Write a SELECT to list all columns from the employees table.",
    level: 1,
    marks: 2,
    type: "MCQ",
  },
  {
    id: "SQL-L1-02",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Filtering",
    text: "Filter orders placed in the last 30 days using WHERE.",
    level: 1,
    marks: 2,
    type: "MCQ",
  },
  {
    id: "SQL-L1-02B",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Filtering",
    text: "Use IN and BETWEEN in a WHERE clause to filter by region and date.",
    level: 1,
    marks: 2,
    type: "MCQ",
  },
  {
    id: "SQL-L1-03",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Sorting & GROUP BY",
    text: "Return top 5 products by total sales using GROUP BY and ORDER BY.",
    level: 1,
    marks: 2,
    type: "MCQ",
  },
  {
    id: "SQL-L1-03B",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Sorting & GROUP BY",
    text: "Find categories with more than 10 orders using GROUP BY and HAVING.",
    level: 2,
    marks: 3,
    type: "MCQ",
  },
  {
    id: "SQL-L1-04",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "INNER JOIN",
    text: "Join customers and orders to show customer name with order id.",
    level: 1,
    marks: 2,
    type: "MCQ",
  },
  {
    id: "SQL-L1-04B",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "INNER JOIN",
    text: "Join products and categories to list product names with category labels.",
    level: 2,
    marks: 3,
    type: "MCQ",
  },
  {
    id: "SQL-L2-01",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "OUTER JOIN",
    text: "List all departments including those with zero employees using LEFT JOIN.",
    level: 2,
    marks: 3,
    type: "MCQ",
  },
  {
    id: "SQL-L2-01B",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "OUTER JOIN",
    text: "Use RIGHT JOIN to find suppliers without any purchase orders.",
    level: 2,
    marks: 3,
    type: "MCQ",
  },
  {
    id: "SQL-L2-02",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "Self JOIN",
    text: "Find employees who report to the same manager using a self join.",
    level: 2,
    marks: 3,
    type: "Coding",
  },
  {
    id: "SQL-L2-02B",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "Self JOIN",
    text: "List employee pairs who work in the same department using a self join.",
    level: 2,
    marks: 3,
    type: "Coding",
  },
  {
    id: "SQL-L2-03",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Subqueries",
    text: "Use a correlated subquery to find products above category average price.",
    level: 2,
    marks: 3,
    type: "Coding",
  },
  {
    id: "SQL-L2-03B",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Subqueries",
    text: "Write a subquery to find customers who placed orders above the monthly average.",
    level: 2,
    marks: 3,
    type: "Coding",
  },
  {
    id: "SQL-L2-04",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Aggregations",
    text: "Compute running total of monthly revenue per region.",
    level: 2,
    marks: 3,
    type: "MCQ",
  },
  {
    id: "SQL-L3-01",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Window Functions",
    text: "Rank sellers by revenue per quarter using ROW_NUMBER and PARTITION BY.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
  {
    id: "SQL-L3-01B",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Window Functions",
    text: "Calculate a 7-day moving average of daily sales using window functions.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
  {
    id: "SQL-L3-02",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Indexing",
    text: "Choose an index strategy for a high-write orders table with range queries.",
    level: 3,
    marks: 5,
    type: "MCQ",
  },
  {
    id: "SQL-L3-02B",
    subject: "SQL",
    topic: "Advanced SQL",
    subtopic: "Indexing",
    text: "Compare clustered vs non-clustered indexes for a reporting workload.",
    level: 3,
    marks: 5,
    type: "MCQ",
  },
  {
    id: "SQL-L3-03",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Filtering",
    text: "Optimize a query with multiple OR conditions on status columns.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
  {
    id: "SQL-L3-03B",
    subject: "SQL",
    topic: "Query Fundamentals",
    subtopic: "Filtering",
    text: "Rewrite OR filters as UNION ALL for better index usage.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
  {
    id: "SQL-L3-04",
    subject: "SQL",
    topic: "Joins & Relations",
    subtopic: "INNER JOIN",
    text: "Design a query plan for joining 4 large fact tables with selective filters.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
  {
    id: "DS-L1-01",
    subject: "Data Structures",
    topic: "Arrays",
    subtopic: "Traversal",
    text: "Reverse an array in-place with O(1) extra space.",
    level: 1,
    marks: 2,
    type: "Coding",
  },
  {
    id: "DS-L2-01",
    subject: "Data Structures",
    topic: "Trees",
    subtopic: "BST",
    text: "Validate whether a binary tree is a valid BST.",
    level: 2,
    marks: 3,
    type: "Coding",
  },
  {
    id: "DS-L3-01",
    subject: "Data Structures",
    topic: "Graphs",
    subtopic: "Shortest path",
    text: "Implement Dijkstra for weighted directed graphs.",
    level: 3,
    marks: 5,
    type: "Coding",
  },
];

export function getSubjects(): string[] {
  return Object.keys(SUBJECT_TOPIC_TREE);
}

export function getTopicsForSubject(subject: string): string[] {
  return Object.keys(SUBJECT_TOPIC_TREE[subject] ?? {});
}

export function getSubtopicsForTopics(
  subject: string,
  topics: string[]
): string[] {
  const tree = SUBJECT_TOPIC_TREE[subject] ?? {};
  const topicList = topics.length > 0 ? topics : Object.keys(tree);
  return topicList.flatMap((topic) => tree[topic] ?? []);
}

export function getSubtopicsByTopic(
  subject: string,
  topics: string[]
): { topic: string; subtopics: string[] }[] {
  const tree = SUBJECT_TOPIC_TREE[subject] ?? {};
  return topics.map((topic) => ({
    topic,
    subtopics: tree[topic] ?? [],
  }));
}

export function buildSubtopicRules(
  subject: string,
  topics: string[],
  selectedSubtopics: string[],
  existingRules: SubtopicQuestionRule[] = []
): SubtopicQuestionRule[] {
  const groups = getSubtopicsByTopic(subject, topics);
  const allFromTopics = groups.flatMap((group) =>
    group.subtopics.map((subtopic) => ({
      topic: group.topic,
      subtopic,
    }))
  );
  const target =
    selectedSubtopics.length > 0
      ? allFromTopics.filter((item) =>
          selectedSubtopics.includes(item.subtopic)
        )
      : allFromTopics;

  return target.map(({ topic, subtopic }) => {
    const existing = existingRules.find((rule) => rule.subtopic === subtopic);
    return {
      topic,
      subtopic,
      levelCounts: normalizeLevelCounts(existing),
    };
  });
}

export function countQuestionsInPool(
  subject: string,
  subtopic: string,
  type: "MCQ" | "Coding",
  level?: number
): number {
  return QUESTION_BANK.filter(
    (question) =>
      question.subject === subject &&
      question.subtopic === subtopic &&
      question.type === type &&
      (level === undefined || question.level === level)
  ).length;
}

export type SubtopicAvailability = {
  mcq: number;
  coding: number;
  total: number;
};

export function getSubtopicAvailability(
  subject: string,
  subtopic: string
): SubtopicAvailability {
  const mcq = countQuestionsInPool(subject, subtopic, "MCQ");
  const coding = countQuestionsInPool(subject, subtopic, "Coding");
  return { mcq, coding, total: mcq + coding };
}

export function getSubtopicLevelAvailability(
  subject: string,
  subtopic: string,
  level: number
): SubtopicAvailability {
  const mcq = countQuestionsInPool(subject, subtopic, "MCQ", level);
  const coding = countQuestionsInPool(subject, subtopic, "Coding", level);
  return { mcq, coding, total: mcq + coding };
}

export function getScopeAvailability(
  subject: string,
  subtopicRules: SubtopicQuestionRule[]
): SubtopicAvailability {
  return subtopicRules.reduce(
    (totals, rule) => {
      const available = getSubtopicAvailability(subject, rule.subtopic);
      return {
        mcq: totals.mcq + available.mcq,
        coding: totals.coding + available.coding,
        total: totals.total + available.total,
      };
    },
    { mcq: 0, coding: 0, total: 0 }
  );
}

export function getSubjectAvailability(subject: string): SubtopicAvailability {
  const questions = QUESTION_BANK.filter((q) => q.subject === subject);
  const mcq = questions.filter((q) => q.type === "MCQ").length;
  const coding = questions.filter((q) => q.type === "Coding").length;
  return { mcq, coding, total: mcq + coding };
}

export function getDefaultLogicForSubject(subject: string): {
  subject: string;
  topics: string[];
  subtopics: string[];
  subtopicRules: SubtopicQuestionRule[];
} {
  return {
    subject,
    topics: [],
    subtopics: [],
    subtopicRules: [],
  };
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}
