// Stores links between source identifiers and internal references.
import { SourceReference } from '../types/domain.types';

export class SourceReferenceRepository {
  private readonly references: SourceReference[] = [];

  async save(reference: SourceReference): Promise<SourceReference> {
    this.references.push(reference);

    return reference;
  }
}
