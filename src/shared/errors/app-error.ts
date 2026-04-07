// Provides a tiny application error type shared across modules.
export class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AppError';
  }
}
