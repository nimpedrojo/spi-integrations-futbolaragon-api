// Encapsulates access to the authenticated Futbol Aragon portal.
import { env } from '../../../config/env';
import { createSourceSnapshot } from '../types/source.types';
import { SourceAccessContext, SourceSnapshot } from '../types/source.types';
import { SessionManager } from './session-manager';

export class AuthFutbolAragonClient {
  constructor(private readonly sessionManager: SessionManager) {}

  async fetchTeamSnapshot(context: SourceAccessContext): Promise<SourceSnapshot> {
    const session = await this.sessionManager.getAuthenticatedSession();

    return createSourceSnapshot({
      teamSlug: context.sourceTeamSlug,
      accessMode: 'authenticated',
      baseUrl: env.futbolAragonAuthBaseUrl || 'https://auth.futbolaragon.example',
      sessionToken: session.token,
    });
  }
}
