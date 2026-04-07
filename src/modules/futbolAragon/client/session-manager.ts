// Placeholder kept only to preserve the planned architecture; session handling is not implemented in this spike.

export type SourceSession = {
  token: string;
  expiresAt: string;
};

export class SessionManager {
  async getAuthenticatedSession(): Promise<SourceSession> {
    throw new Error('Authenticated session management is intentionally disabled for this spike');
  }
}
