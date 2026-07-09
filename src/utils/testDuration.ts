import { DEFAULT_LEVEL_RULES } from "../data/mockData";
import { getRuleCodingTotal, getRuleMcqTotal } from "../data/questionBank";
import type { LevelRule, QuestionSelectionLogic } from "../types";

/** Minutes allocated per question type when deriving duration from selection logic. */
const MINUTES_PER_MCQ = 1;
const MINUTES_PER_CODING = 5;

export function computeDurationFromSelectionLogic(
  logic: QuestionSelectionLogic
): number {
  return logic.subtopicRules.reduce((total, rule) => {
    const mcq = getRuleMcqTotal(rule);
    const coding = getRuleCodingTotal(rule);
    return total + mcq * MINUTES_PER_MCQ + coding * MINUTES_PER_CODING;
  }, 0);
}

/** Subject / overall final tests: one minute per mark from level rules. */
export function computeDurationFromLevelRules(rules: LevelRule[]): number {
  return rules.reduce(
    (total, rule) => total + rule.questionCount * rule.marksPerQuestion,
    0
  );
}

export function getDefaultFinalTestDuration(): number {
  return computeDurationFromLevelRules(DEFAULT_LEVEL_RULES);
}
