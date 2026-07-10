import {
  QUESTION_BANK,
  QUESTION_LEVELS,
  getRuleCodingTotal,
  getRuleMcqTotal,
} from "../data/questionBank";
import type { Question, QuestionSelectionLogic } from "../types";
import {
  getLogicSubjects,
  resolveRuleSubject,
} from "./selectionLogicHelpers";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function filterQuestionPool(logic: QuestionSelectionLogic): Question[] {
  const subjects = getLogicSubjects(logic);

  return QUESTION_BANK.filter((question) => {
    if (!subjects.includes(question.subject)) return false;
    if (logic.topics.length > 0) {
      const topicMatches = logic.subtopicRules.length > 0
        ? logic.subtopicRules.some(
            (rule) =>
              resolveRuleSubject(rule, logic) === question.subject &&
              rule.topic === question.topic
          )
        : logic.topics.some((topicValue) => {
            if (logic.subjects?.length) {
              const sep = topicValue.indexOf("::");
              if (sep === -1) return false;
              const subject = topicValue.slice(0, sep);
              const topic = topicValue.slice(sep + 2);
              return question.subject === subject && question.topic === topic;
            }
            return question.topic === topicValue;
          });
      if (!topicMatches) return false;
    }
    if (
      logic.subtopics.length > 0 &&
      !logic.subtopics.some((subtopicValue) => {
        if (logic.subjects?.length) {
          const sep = subtopicValue.indexOf("::");
          if (sep === -1) return false;
          const subject = subtopicValue.slice(0, sep);
          const subtopic = subtopicValue.slice(sep + 2);
          return (
            question.subject === subject && question.subtopic === subtopic
          );
        }
        return question.subtopic === subtopicValue;
      })
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
    const ruleSubject = resolveRuleSubject(rule, logic);

    QUESTION_LEVELS.forEach((level) => {
      const levelRule = rule.levelCounts.find((item) => item.level === level);
      if (!levelRule) return;

      (["MCQ", "Coding"] as const).forEach((type) => {
        const count =
          type === "MCQ" ? levelRule.mcqCount : levelRule.codingCount;
        if (count <= 0) return;

        const pool = QUESTION_BANK.filter(
          (question) =>
            question.subject === ruleSubject &&
            question.topic === rule.topic &&
            question.subtopic === rule.subtopic &&
            question.level === level &&
            question.type === type &&
            !excludeIds.includes(question.id) &&
            !selected.some((picked) => picked.id === question.id)
        );

        const picks = shuffle(pool).slice(0, count);
        if (picks.length < count) {
          warnings.push(
            `${ruleSubject} · ${rule.subtopic} L${level} (${type}): only ${picks.length} of ${count} questions available.`
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

  const subjects = getLogicSubjects(logic);
  if (!subjects.includes(current.subject)) return [];

  return QUESTION_BANK.filter(
    (question) =>
      question.subject === current.subject &&
      question.subtopic === current.subtopic &&
      question.type === current.type &&
      question.level === current.level &&
      question.id !== currentQuestionId &&
      !assignedQuestionIds.includes(question.id)
  );
}
