import {
  buildSubtopicRules,
  getSubjects,
  getSubtopicAvailability,
  getSubtopicsByTopic,
  getSubtopicsForTopics,
  getSubjectAvailability,
  getTopicsForSubject,
} from "../data/questionBank";
import type { QuestionSelectionLogic, SubtopicQuestionRule } from "../types";

export const SCOPE_SEP = "::";

export function allowsMultiSubjectSelection(testType: string): boolean {
  return testType === "Practice Test" || testType === "Overall Test";
}

export function encodeScope(subject: string, name: string): string {
  return `${subject}${SCOPE_SEP}${name}`;
}

export function decodeScope(value: string): { subject: string; name: string } {
  const idx = value.indexOf(SCOPE_SEP);
  if (idx === -1) {
    return { subject: "", name: value };
  }
  return {
    subject: value.slice(0, idx),
    name: value.slice(idx + SCOPE_SEP.length),
  };
}

export function getLogicSubjects(logic: QuestionSelectionLogic): string[] {
  if (logic.subjects?.length) return [...logic.subjects];
  return logic.subject ? [logic.subject] : [];
}

export function resolveRuleSubject(
  rule: SubtopicQuestionRule,
  logic: QuestionSelectionLogic
): string {
  return rule.subject ?? logic.subject;
}

export function formatLogicSubjects(logic: QuestionSelectionLogic): string {
  const subjects = getLogicSubjects(logic);
  return subjects.length > 0 ? subjects.join(" · ") : logic.subject;
}

export function getDefaultLogicForTest(
  testSubject: string,
  allowMultiSubject: boolean
): QuestionSelectionLogic {
  const options = getSubjects();
  if (allowMultiSubject) {
    const initial = options.includes(testSubject) ? [testSubject] : [];
    return {
      subject: initial.join(" · ") || testSubject,
      subjects: initial,
      topics: [],
      subtopics: [],
      subtopicRules: [],
    };
  }

  const subject = options.includes(testSubject)
    ? testSubject
    : options[0] ?? testSubject;

  return {
    subject,
    topics: [],
    subtopics: [],
    subtopicRules: [],
  };
}

export function buildSubtopicRulesFromSelection(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean,
  topics: string[],
  selectedSubtopics: string[],
  existingRules: SubtopicQuestionRule[] = []
): SubtopicQuestionRule[] {
  if (!allowMultiSubject) {
    return buildSubtopicRules(
      logic.subject,
      topics,
      selectedSubtopics,
      existingRules
    );
  }

  const topicItems = topics.map((value) => decodeScope(value));
  const allFromTopics = topicItems.flatMap(({ subject, name: topic }) =>
    (getSubtopicsByTopic(subject, [topic])[0]?.subtopics ?? []).map(
      (subtopic) => ({ subject, topic, subtopic })
    )
  );

  const target =
    selectedSubtopics.length > 0
      ? allFromTopics.filter((item) =>
          selectedSubtopics.includes(encodeScope(item.subject, item.subtopic))
        )
      : allFromTopics;

  return target.map(({ subject, topic, subtopic }) => {
    const existing = existingRules.find(
      (rule) =>
        rule.subtopic === subtopic &&
        (rule.subject ?? logic.subject) === subject
    );
    if (existing) {
      return {
        subject,
        topic,
        subtopic,
        levelCounts: existing.levelCounts,
      };
    }
    const built = buildSubtopicRules(subject, [topic], [subtopic], [])[0];
    return {
      subject,
      topic,
      subtopic,
      levelCounts: built?.levelCounts ?? [],
    };
  });
}

export function getValidSubtopicsForTopics(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean,
  topics: string[]
): string[] {
  if (!allowMultiSubject) {
    return getSubtopicsForTopics(logic.subject, topics);
  }

  return topics.flatMap((value) => {
    const { subject, name: topic } = decodeScope(value);
    return getSubtopicsForTopics(subject, [topic]).map((subtopic) =>
      encodeScope(subject, subtopic)
    );
  });
}

export function getSubjectsCombinedAvailability(subjects: string[]) {
  return subjects.reduce(
    (totals, subject) => {
      const available = getSubjectAvailability(subject);
      return {
        mcq: totals.mcq + available.mcq,
        coding: totals.coding + available.coding,
        total: totals.total + available.total,
      };
    },
    { mcq: 0, coding: 0, total: 0 }
  );
}

export function getScopeAvailabilityForLogic(logic: QuestionSelectionLogic) {
  return logic.subtopicRules.reduce(
    (totals, rule) => {
      const subject = resolveRuleSubject(rule, logic);
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

export function getTopicOptionsForLogic(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean
) {
  const subjects = getLogicSubjects(logic);
  if (!allowMultiSubject) {
    return getTopicsForSubject(logic.subject).map((topic) => ({
      value: topic,
      label: topic,
    }));
  }

  return subjects.flatMap((subject) =>
    getTopicsForSubject(subject).map((topic) => ({
      value: encodeScope(subject, topic),
      label: `${subject} — ${topic}`,
    }))
  );
}

export function getSubtopicOptionsForLogic(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean
) {
  if (!allowMultiSubject) {
    return getSubtopicsByTopic(logic.subject, logic.topics).flatMap((group) =>
      group.subtopics.map((subtopic) => {
        const available = getSubtopicAvailability(logic.subject, subtopic);
        return {
          value: subtopic,
          label: `${group.topic} — ${subtopic} (${available.mcq} MCQ, ${available.coding} Coding in DB)`,
        };
      })
    );
  }

  return logic.topics.flatMap((topicValue) => {
    const { subject, name: topic } = decodeScope(topicValue);
    const subtopics = getSubtopicsByTopic(subject, [topic])[0]?.subtopics ?? [];
    return subtopics.map((subtopic) => {
      const available = getSubtopicAvailability(subject, subtopic);
      return {
        value: encodeScope(subject, subtopic),
        label: `${subject} · ${topic} — ${subtopic} (${available.mcq} MCQ, ${available.coding} Coding in DB)`,
      };
    });
  });
}

export function normalizeLogicSubjects(
  logic: QuestionSelectionLogic,
  allowMultiSubject: boolean
): QuestionSelectionLogic {
  if (!allowMultiSubject) {
    const { subjects: _subjects, ...rest } = logic;
    return rest;
  }

  const subjects = getLogicSubjects(logic);
  return {
    ...logic,
    subjects,
    subject: subjects.join(" · "),
  };
}
