// Stores reusable source-to-internal correspondences in filesystem-backed JSON for the spike.
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { SourceReference, SourceReferenceNavigation } from '../types/domain.types';

export type SourceReferenceLookup = {
  sourceSystem?: SourceReference['sourceSystem'];
  entityType?: SourceReference['entityType'] | SourceReference['entity'];
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
};

export class SourceReferenceRepository {
  private readonly store = new JsonFileStore<SourceReference>(
    path.resolve(process.cwd(), '.data', 'futbol-aragon', 'normalized', 'source-references.json'),
  );

  async save(reference: SourceReference): Promise<SourceReference> {
    const now = new Date().toISOString();
    const entityType = reference.entityType ?? reference.entity;
    const persistedReference: SourceReference = {
      ...reference,
      id: reference.id ?? `src-ref-${entityType}-${reference.internalId}-${Date.now()}`,
      entity: entityType,
      entityType,
      createdAt: reference.createdAt ?? now,
      updatedAt: now,
      lastSeenAt: reference.lastSeenAt ?? now,
    };

    await this.store.upsertOne(persistedReference, (item) => this.buildStorageKey(item));

    return persistedReference;
  }

  async saveNavigation(
    internalId: string,
    navigation: SourceReferenceNavigation,
    entityType: SourceReference['entity'] = 'team',
  ): Promise<SourceReference | null> {
    const references = await this.findByInternalId(internalId, entityType);
    const reference = references[0];

    if (!reference) {
      return null;
    }

    return this.save({
      ...reference,
      navigation: {
        ...reference.navigation,
        ...navigation,
      },
    });
  }

  async findByInternalId(internalId: string, entityType: SourceReference['entity'] = 'team'): Promise<SourceReference[]> {
    const references = await this.store.readAll();

    return references.filter((reference) => {
      const normalizedEntityType = reference.entityType ?? reference.entity;

      return reference.internalId === internalId && normalizedEntityType === entityType;
    });
  }

  async findBySourceReference(lookup: SourceReferenceLookup): Promise<SourceReference | null> {
    const references = await this.store.readAll();

    return (
      references.find((reference) => {
        const normalizedEntityType = reference.entityType ?? reference.entity;

        if (lookup.sourceSystem && reference.sourceSystem !== lookup.sourceSystem) {
          return false;
        }

        if (lookup.entityType && normalizedEntityType !== lookup.entityType) {
          return false;
        }

        if (lookup.sourceId && reference.sourceId !== lookup.sourceId) {
          return false;
        }

        if (lookup.sourceUrl && reference.sourceUrl !== lookup.sourceUrl) {
          return false;
        }

        if (lookup.sourceName && reference.sourceName !== lookup.sourceName) {
          return false;
        }

        return lookup.sourceId !== undefined || lookup.sourceUrl !== undefined || lookup.sourceName !== undefined;
      }) ?? null
    );
  }

  async getNavigationByInternalId(
    internalId: string,
    entityType: SourceReference['entity'] = 'team',
  ): Promise<SourceReferenceNavigation | undefined> {
    const references = await this.findByInternalId(internalId, entityType);

    return references[0]?.navigation;
  }

  private buildStorageKey(reference: SourceReference): string {
    const entityType = reference.entityType ?? reference.entity;
    const sourceIdentity = reference.sourceId ?? reference.sourceUrl ?? reference.sourceName ?? 'unknown-source';

    return `${reference.sourceSystem ?? 'unknown-system'}:${entityType}:${reference.internalId}:${sourceIdentity}`;
  }
}
