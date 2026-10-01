import type { Answers, Question } from "./types";

/**
 * Converts raw string input (URL query, form data) into typed answers.
 * Only declared questions are read; malformed values are left out so that
 * `validateAnswers` reports them as missing.
 */
export function parseAnswers(
  questions: readonly Question[],
  raw: (key: string) => string | null | undefined,
): Answers {
  const answers: Record<string, string | boolean> = {};
  for (const question of questions) {
    const value = raw(question.id);
    if (value == null) continue;
    if (question.kind === "boolean") {
      if (value === "true") answers[question.id] = true;
      else if (value === "false") answers[question.id] = false;
    } else if (question.options.some((option) => option.value === value)) {
      answers[question.id] = value;
    }
  }
  return answers;
}
