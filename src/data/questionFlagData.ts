export type QuestionUsageRecord = {
  testId: string;
  course: string;
  batch: string;
};

export type FlaggedQuestionState = {
  questionId: string;
  flaggedAt: string;
  flaggedBy: string;
  disabled: boolean;
};

const FLAGGED_KEY = "flagged-questions";

/** Static examples — questions already used in prior tests */
export const STATIC_QUESTION_USAGE: Record<string, QuestionUsageRecord[]> = {
  "SQL-L1-01": [{ testId: "PT-12M-001", course: "12M 2026", batch: "Batch-01" }],
  "SQL-L2-01": [
    { testId: "PT-12M-001", course: "12M 2026", batch: "Batch-01" },
    { testId: "FT-PREV", course: "FYP 2026", batch: "Batch-04" },
  ],
};

export function getQuestionUsage(questionId: string): QuestionUsageRecord[] {
  return STATIC_QUESTION_USAGE[questionId] ?? [];
}

export function isQuestionUsedInAnyTest(questionId: string): boolean {
  return getQuestionUsage(questionId).length > 0;
}

export function loadFlaggedQuestions(): FlaggedQuestionState[] {
  try {
    const raw = sessionStorage.getItem(FLAGGED_KEY);
    return raw ? (JSON.parse(raw) as FlaggedQuestionState[]) : [];
  } catch {
    return [];
  }
}

export function flagQuestion(questionId: string, flaggedBy: string): FlaggedQuestionState {
  const existing = loadFlaggedQuestions();
  const canDisable = !isQuestionUsedInAnyTest(questionId);
  const entry: FlaggedQuestionState = {
    questionId,
    flaggedAt: new Date().toISOString(),
    flaggedBy,
    disabled: canDisable,
  };
  const without = existing.filter((q) => q.questionId !== questionId);
  sessionStorage.setItem(FLAGGED_KEY, JSON.stringify([entry, ...without]));
  return entry;
}

export function isQuestionDisabled(questionId: string): boolean {
  return loadFlaggedQuestions().some((q) => q.questionId === questionId && q.disabled);
}
