import { QUESTION_BANK } from "../data/questionBank";
import type { LevelRule, Question, QuestionSelectionLogic } from "../types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildSubjectLevelLogic(subject: string): QuestionSelectionLogic {
  const pool = QUESTION_BANK.filter((q) => q.subject === subject);
  const topics = [...new Set(pool.map((q) => q.topic))];
  const subtopics = [...new Set(pool.map((q) => q.subtopic))];
  return {
    subject,
    topics,
    subtopics,
    subtopicRules: [],
  };
}

export function generateQuestionsFromLevelRules(
  subject: string,
  levelRules: LevelRule[]
): { questionIds: string[]; warnings: string[] } {
  const selected: Question[] = [];
  const warnings: string[] = [];
  const usedIds = new Set<string>();

  levelRules.forEach((rule) => {
    const pool = QUESTION_BANK.filter(
      (question) =>
        question.subject === subject &&
        question.level === rule.level &&
        !usedIds.has(question.id)
    );
    const picks = shuffle(pool).slice(0, rule.questionCount);
    if (picks.length < rule.questionCount) {
      warnings.push(
        `Level ${rule.level} (${rule.label}): only ${picks.length} of ${rule.questionCount} questions available.`
      );
    }
    picks.forEach((question) => usedIds.add(question.id));
    selected.push(...picks);
  });

  return {
    questionIds: selected.map((question) => question.id),
    warnings,
  };
}
