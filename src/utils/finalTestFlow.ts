import { buildTestName, type CreateTestType } from "../constants/createTestConstants";

export const FINAL_TEST_GENERATE_LIMIT = 10;
export const MOCK_TRAINER_ID = "trainer-ravi";
export const MOCK_TRAINER_NAME = "Ravi Kumar";

export function isAutoFinalTest(type: string): boolean {
  return type === "Subject Final Test" || type === "Overall Test";
}

function sequenceStorageKey(subject: string, course: string, type: string): string {
  return `final-test-seq:${type}:${subject}:${course}`;
}

export function allocateFinalTestName(
  subject: string,
  course: string,
  type: CreateTestType | string
): string {
  const key = sequenceStorageKey(subject, course, type);
  const current = Number(sessionStorage.getItem(key) ?? "0");
  const next = current + 1;
  sessionStorage.setItem(key, String(next));
  return buildTestName({ type, subject, courseCode: course, seq: next });
}

export function peekFinalTestSequence(
  subject: string,
  course: string,
  type: string
): number {
  return Number(sessionStorage.getItem(sequenceStorageKey(subject, course, type)) ?? "0") + 1;
}

function generateCountKey(trainerId: string): string {
  return `final-test-generate-count:${trainerId}`;
}

export function getGenerateCount(trainerId: string = MOCK_TRAINER_ID): number {
  return Number(sessionStorage.getItem(generateCountKey(trainerId)) ?? "0");
}

export function incrementGenerateCount(
  trainerId: string = MOCK_TRAINER_ID
): { count: number; overLimit: boolean } {
  const count = getGenerateCount(trainerId) + 1;
  sessionStorage.setItem(generateCountKey(trainerId), String(count));
  return { count, overLimit: count > FINAL_TEST_GENERATE_LIMIT };
}

export type TrainerPerformanceEvent = {
  id: string;
  trainerId: string;
  trainerName: string;
  testName: string;
  subject: string;
  course: string;
  generatedAt: string;
  used: boolean;
};

const PERFORMANCE_KEY = "trainer-performance-events";

export function loadTrainerPerformanceEvents(): TrainerPerformanceEvent[] {
  try {
    const raw = sessionStorage.getItem(PERFORMANCE_KEY);
    return raw ? (JSON.parse(raw) as TrainerPerformanceEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveTrainerPerformanceEvents(events: TrainerPerformanceEvent[]): void {
  sessionStorage.setItem(PERFORMANCE_KEY, JSON.stringify(events));
}

export function recordGenerationEvent(options: {
  testName: string;
  subject: string;
  course: string;
  used: boolean;
  trainerId?: string;
  trainerName?: string;
}): TrainerPerformanceEvent {
  const event: TrainerPerformanceEvent = {
    id: `gen-${Date.now()}`,
    trainerId: options.trainerId ?? MOCK_TRAINER_ID,
    trainerName: options.trainerName ?? MOCK_TRAINER_NAME,
    testName: options.testName,
    subject: options.subject,
    course: options.course,
    generatedAt: new Date().toISOString(),
    used: options.used,
  };
  const events = loadTrainerPerformanceEvents();
  events.unshift(event);
  saveTrainerPerformanceEvents(events.slice(0, 50));
  return event;
}

export function markGenerationUsed(testName: string): void {
  const events = loadTrainerPerformanceEvents();
  const updated = events.map((e) =>
    e.testName === testName && !e.used ? { ...e, used: true } : e
  );
  saveTrainerPerformanceEvents(updated);
}

export function getUnusedGenerationCount(trainerId: string = MOCK_TRAINER_ID): number {
  return loadTrainerPerformanceEvents().filter((e) => e.trainerId === trainerId && !e.used)
    .length;
}
