import {
  QUESTION_BANK,
  QUESTION_LEVELS,
  getRuleCodingTotal,
  getRuleMcqTotal,
} from "../data/questionBank";
import type { Question, QuestionSelectionLogic } from "../types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function filterQuestionPool(logic: QuestionSelectionLogic): Question[] {
  return QUESTION_BANK.filter((question) => {
    if (question.subject !== logic.subject) return false;
    if (logic.topics.length > 0 && !logic.topics.includes(question.topic)) {
      return false;
    }
    if (
      logic.subtopics.length > 0 &&
      !logic.subtopics.includes(question.subtopic)
    ) {
      return false;
    }
    return true;
  });
}

export function getTotalQuestionTarget(logic: QuestionSelectionLogic): number {
  return logic.subtopicRules.reduce(
    (total, rule) => total + getRuleMcqTotal(rule) + getRuleCodingTotal(rule),
    0
  );
}

export function summarizeSubtopicRules(logic: QuestionSelectionLogic): string {
  const mcq = logic.subtopicRules.reduce((n, rule) => n + getRuleMcqTotal(rule), 0);
  const coding = logic.subtopicRules.reduce(
    (n, rule) => n + getRuleCodingTotal(rule),
    0
  );
  return `${mcq} MCQ · ${coding} Coding`;
}

export function generateQuestionsFromLogic(
  logic: QuestionSelectionLogic,
  excludeIds: string[] = []
): { questionIds: string[]; warnings: string[] } {
  const selected: Question[] = [];
  const warnings: string[] = [];

  logic.subtopicRules.forEach((rule) => {
    QUESTION_LEVELS.forEach((level) => {
      const levelRule = rule.levelCounts.find((item) => item.level === level);
      if (!levelRule) return;

      (["MCQ", "Coding"] as const).forEach((type) => {
        const count =
          type === "MCQ" ? levelRule.mcqCount : levelRule.codingCount;
        if (count <= 0) return;

        const pool = QUESTION_BANK.filter(
          (question) =>
            question.subject === logic.subject &&
            question.subtopic === rule.subtopic &&
            question.level === level &&
            question.type === type &&
            !excludeIds.includes(question.id) &&
            !selected.some((picked) => picked.id === question.id)
        );

        const picks = shuffle(pool).slice(0, count);
        if (picks.length < count) {
          warnings.push(
            `${rule.subtopic} L${level} (${type}): only ${picks.length} of ${count} questions available.`
          );
        }
        selected.push(...picks);
      });
    });
  });

  return {
    questionIds: selected.map((question) => question.id),
    warnings,
  };
}

export function getSwapCandidates(
  logic: QuestionSelectionLogic,
  currentQuestionId: string,
  assignedQuestionIds: string[]
): Question[] {
  const current = QUESTION_BANK.find(
    (question) => question.id === currentQuestionId
  );
  if (!current) return [];

  return filterQuestionPool(logic).filter(
    (question) =>
      question.subtopic === current.subtopic &&
      question.type === current.type &&
      question.id !== currentQuestionId &&
      !assignedQuestionIds.includes(question.id)
  );
}
