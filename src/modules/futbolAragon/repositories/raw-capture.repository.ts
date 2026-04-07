// Stores raw source payloads before any normalization happens.
import { SourceSnapshot } from '../types/source.types';

export type RawCaptureRecord = {
  syncRunId: string;
  snapshot: SourceSnapshot;
  capturedAt: string;
};

export class RawCaptureRepository {
  private readonly captures: RawCaptureRecord[] = [];

  async save(syncRunId: string, snapshot: SourceSnapshot): Promise<RawCaptureRecord> {
    const record = {
      syncRunId,
      snapshot,
      capturedAt: new Date().toISOString(),
    };

    this.captures.push(record);

    return record;
  }
}
