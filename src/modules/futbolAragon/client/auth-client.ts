// Placeholder kept only to preserve the planned architecture; authenticated access is not used in this spike.
import { SourceAccessContext, SourceSnapshot } from '../types/source.types';
import { SessionManager } from './session-manager';

export class AuthFutbolAragonClient {
  constructor(private readonly sessionManager: SessionManager) {
    void this.sessionManager;
  }

  async fetchTeamSnapshot(context: SourceAccessContext): Promise<SourceSnapshot> {
    void context;

    throw new Error('Authenticated Futbol Aragon access is intentionally disabled for this spike');
  }
}
