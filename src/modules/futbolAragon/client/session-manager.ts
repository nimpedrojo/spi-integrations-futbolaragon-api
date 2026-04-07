// Manages authenticated source sessions without leaking auth details to other layers.
import { env } from '../../../config/env';

export type SourceSession = {
  token: string;
  expiresAt: string;
};

export class SessionManager {
  async getAuthenticatedSession(): Promise<SourceSession> {
    return {
      token: `${env.futbolAragonUsername || 'anonymous'}-stub-session`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
}
