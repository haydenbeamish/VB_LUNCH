/**
 * Check if a prediction is correct, handling both boolean and numeric (1/0)
 * values from the API.
 */
export function isCorrect(value: unknown): boolean {
  return value === true || (value as unknown) === 1;
}

export function isIncorrect(value: unknown): boolean {
  return value === false || (value as unknown) === 0;
}
