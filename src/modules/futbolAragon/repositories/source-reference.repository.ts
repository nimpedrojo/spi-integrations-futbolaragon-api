// Stores reusable source-to-internal correspondences in MariaDB through Prisma.
import { Prisma, SourceReference as PrismaSourceReference } from '@prisma/client';

import { prisma } from '../../../shared/prisma/prisma';
import { JsonObject, SourceReference, SourceReferenceNavigation } from '../types/domain.types';

export type SourceReferenceLookup = {
  sourceSystem?: SourceReference['sourceSystem'];
  entityType?: SourceReference['entityType'] | SourceReference['entity'];
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
};

export class SourceReferenceRepository {
  async save(reference: SourceReference): Promise<SourceReference> {
    const now = new Date().toISOString();
    const entityType = reference.entityType ?? reference.entity;
    const normalizedReference: SourceReference = {
      ...reference,
      id: reference.id ?? `src-ref-${entityType}-${reference.internalId}-${Date.now()}`,
      entity: entityType,
      entityType,
      createdAt: reference.createdAt ?? now,
      updatedAt: now,
      lastSeenAt: reference.lastSeenAt ?? now,
    };

    const existingReference = await this.findExistingReference(normalizedReference);

    if (existingReference) {
      const updated = await prisma.sourceReference.update({
        where: { id: existingReference.id },
        data: this.toPrismaUpdateData(normalizedReference),
      });

      return this.toDomain(updated);
    }

    const created = await prisma.sourceReference.create({
      data: this.toPrismaCreateData(normalizedReference),
    });

    return this.toDomain(created);
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
    const references = await prisma.sourceReference.findMany({
      where: {
        internalId,
        ...this.buildContextWhere({ entityType }),
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return references.map((reference) => this.toDomain(reference));
  }

  async findBySourceReference(lookup: SourceReferenceLookup): Promise<SourceReference | null> {
    if (lookup.sourceId === undefined && lookup.sourceUrl === undefined && lookup.sourceName === undefined) {
      return null;
    }

    const identityWhere =
      lookup.sourceId !== undefined
        ? { sourceId: lookup.sourceId }
        : lookup.sourceUrl !== undefined
          ? { sourceUrl: lookup.sourceUrl }
          : { sourceName: lookup.sourceName };

    const reference = await prisma.sourceReference.findFirst({
      where: {
        ...this.buildContextWhere(lookup),
        ...identityWhere,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return reference ? this.toDomain(reference) : null;
  }

  async getNavigationByInternalId(
    internalId: string,
    entityType: SourceReference['entity'] = 'team',
  ): Promise<SourceReferenceNavigation | undefined> {
    const references = await this.findByInternalId(internalId, entityType);

    return references[0]?.navigation;
  }

  private async findExistingReference(reference: SourceReference): Promise<PrismaSourceReference | null> {
    const sourceSystem = reference.sourceSystem ?? null;
    const entityType = reference.entityType ?? reference.entity;

    if (reference.id) {
      const byId = await prisma.sourceReference.findUnique({
        where: { id: reference.id },
      });

      if (byId) {
        return byId;
      }
    }

    const candidates = await prisma.sourceReference.findMany({
      where: {
        internalId: reference.internalId,
        ...this.buildContextWhere({
          sourceSystem: sourceSystem ?? undefined,
          entityType,
        }),
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return (
      candidates.find((candidate) => reference.sourceId !== undefined && candidate.sourceId === reference.sourceId) ??
      candidates.find((candidate) => reference.sourceUrl !== undefined && candidate.sourceUrl === reference.sourceUrl) ??
      candidates.find((candidate) => reference.sourceName !== undefined && candidate.sourceName === reference.sourceName) ??
      candidates[0] ??
      null
    );
  }

  private toPrismaCreateData(reference: SourceReference): Prisma.SourceReferenceCreateInput {
    return {
      id: reference.id ?? `src-ref-${reference.entity}-${reference.internalId}-${Date.now()}`,
      entity: reference.entity,
      entityType: reference.entityType,
      internalId: reference.internalId,
      internalName: reference.internalName,
      sourceId: reference.sourceId,
      sourceName: reference.sourceName,
      sourceClubName: reference.sourceClubName,
      sourceSystem: reference.sourceSystem,
      sourceEntityType: reference.sourceEntityType,
      sourceUrl: reference.sourceUrl,
      navigation: this.toNullableJsonValue(reference.navigation),
      notes: reference.notes,
      metadata: this.toNullableJsonValue(reference.metadata),
      updatedAt: this.toDate(reference.updatedAt),
      lastSeenAt: this.toNullableDate(reference.lastSeenAt),
    };
  }

  private buildContextWhere(input: {
    sourceSystem?: SourceReference['sourceSystem'];
    entityType?: SourceReference['entityType'] | SourceReference['entity'];
  }): Prisma.SourceReferenceWhereInput {
    return {
      ...(input.sourceSystem ? { sourceSystem: input.sourceSystem } : {}),
      ...(input.entityType ? { OR: [{ entity: input.entityType }, { entityType: input.entityType }] } : {}),
    };
  }

  private toPrismaUpdateData(reference: SourceReference): Prisma.SourceReferenceUpdateInput {
    return {
      entity: reference.entity,
      entityType: reference.entityType,
      internalId: reference.internalId,
      internalName: reference.internalName,
      sourceId: reference.sourceId,
      sourceName: reference.sourceName,
      sourceClubName: reference.sourceClubName,
      sourceSystem: reference.sourceSystem,
      sourceEntityType: reference.sourceEntityType,
      sourceUrl: reference.sourceUrl,
      navigation: this.toNullableJsonValue(reference.navigation),
      notes: reference.notes,
      metadata: this.toNullableJsonValue(reference.metadata),
      updatedAt: this.toDate(reference.updatedAt),
      lastSeenAt: this.toNullableDate(reference.lastSeenAt),
    };
  }

  private toDomain(reference: PrismaSourceReference): SourceReference {
    return {
      id: reference.id,
      entity: reference.entity as SourceReference['entity'],
      entityType: (reference.entityType ?? undefined) as SourceReference['entityType'],
      internalId: reference.internalId,
      internalName: reference.internalName ?? undefined,
      sourceId: reference.sourceId ?? undefined,
      sourceName: reference.sourceName ?? undefined,
      sourceClubName: reference.sourceClubName ?? undefined,
      sourceSystem: (reference.sourceSystem ?? undefined) as SourceReference['sourceSystem'],
      sourceEntityType: reference.sourceEntityType ?? undefined,
      sourceUrl: reference.sourceUrl ?? undefined,
      navigation: this.fromJsonObject(reference.navigation) as SourceReferenceNavigation | undefined,
      notes: reference.notes ?? undefined,
      metadata: this.fromJsonObject(reference.metadata),
      createdAt: reference.createdAt.toISOString(),
      updatedAt: reference.updatedAt.toISOString(),
      lastSeenAt: reference.lastSeenAt?.toISOString(),
    };
  }

  private toNullableJsonValue(value?: object | null): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
  }

  private fromJsonObject(value: Prisma.JsonValue | null): JsonObject | undefined {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return undefined;
    }

    return value as JsonObject;
  }

  private toDate(value?: string): Date {
    return value ? new Date(value) : new Date();
  }

  private toNullableDate(value?: string): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value ? new Date(value) : null;
  }
}
