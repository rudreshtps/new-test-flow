import { QUESTION_BANK } from "../data/questionBank";
import { isQuestionDisabled } from "../data/questionFlagData";
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

function pickWithRepeatFallback(
  pool: Question[],
  count: number,
  usedIds: Set<string>,
  level: number,
  label: string,
  warnings: string[]
): Question[] {
  const available = pool.filter((q) => !usedIds.has(q.id) && !isQuestionDisabled(q.id));
  const picks: Question[] = shuffle(available).slice(0, count);

  if (picks.length < count) {
    const shortfall = count - picks.length;
    const repeatPool = pool.filter(
      (q) => !picks.some((p) => p.id === q.id) && !isQuestionDisabled(q.id)
    );
    const repeats = shuffle(repeatPool).slice(0, shortfall);
    repeats.forEach((q) => {
      const note =
        q.type === "Coding"
          ? `reordered test cases`
          : `shuffled MCQ options`;
      warnings.push(
        `Level ${level} (${label}): repeated ${q.id} — ${note} (bank shortfall).`
      );
    });
    picks.push(...repeats);
  }

  if (picks.length < count) {
    warnings.push(
      `Level ${level} (${label}): only ${picks.length} of ${count} questions available even with repeats.`
    );
  }

  picks.forEach((q) => usedIds.add(q.id));
  return picks;
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
      (question) => question.subject === subject && question.level === rule.level
    );
    const picks = pickWithRepeatFallback(
      pool,
      rule.questionCount,
      usedIds,
      rule.level,
      rule.label,
      warnings
    );
    selected.push(...picks);
  });

  const disabledSkipped = QUESTION_BANK.filter(
    (q) => q.subject === subject && isQuestionDisabled(q.id)
  ).length;
  if (disabledSkipped > 0) {
    warnings.push(
      `${disabledSkipped} question(s) in bank excluded — flagged and disabled.`
    );
  }

  return {
    questionIds: selected.map((question) => question.id),
    warnings,
  };
}
