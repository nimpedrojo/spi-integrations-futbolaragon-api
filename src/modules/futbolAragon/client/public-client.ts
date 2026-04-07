// Encapsulates access to the public Futbol Aragon portal.
import { env } from '../../../config/env';
import { createSourceSnapshot } from '../types/source.types';
import { SourceAccessContext, SourceSnapshot } from '../types/source.types';

export class PublicFutbolAragonClient {
  async fetchTeamSnapshot(context: SourceAccessContext): Promise<SourceSnapshot> {
    return createSourceSnapshot({
      teamSlug: context.sourceTeamSlug,
      accessMode: 'public',
      baseUrl: env.futbolAragonPublicBaseUrl || 'https://public.futbolaragon.example',
    });
  }
}
