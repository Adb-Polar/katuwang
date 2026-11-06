/** Expected conflicts must roll back the transaction, including its claim. */
export class AssessmentSubmissionError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}

export function assertSubmissionClaim(result: { count: number }): void {
  if (result.count !== 1) throw new AssessmentSubmissionError("This attempt has already been submitted.");
}
