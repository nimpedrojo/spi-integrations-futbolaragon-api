// Stores raw ingestion evidence before extraction or normalization happens.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { JsonFileStore } from '../../../shared/utils/json-file-store';
import { FetchPageResult } from '../client/public-client';
import {
  RawCaptureEntityType,
  RawCaptureEvidence,
  RawCaptureParseStatus,
  SourceAccessMode,
  SourceSnapshot,
} from '../types/source.types';

export type RawCaptureRecord = {
  syncRunId: string;
  snapshot: SourceSnapshot;
  capturedAt: string;
  outputPath?: string;
};

export type SaveRawPageCaptureInput = {
  key: string;
  entityType: RawCaptureEntityType;
  sourceUrl: string;
  accessMode: SourceAccessMode;
  page: FetchPageResult;
  parseStatus?: RawCaptureParseStatus;
  errorMessage?: string;
  outputDirectory?: string;
};

export type RawPageCaptureRecord = RawCaptureEvidence & {
  key: string;
  outputPath?: string;
  headers: Record<string, string | string[] | undefined>;
  durationMs: number;
};

export class RawCaptureRepository {
  private readonly baseDirectory = path.resolve(process.cwd(), '.data', 'futbol-aragon', 'raw');
  private readonly snapshotPayloadDirectory = path.join(this.baseDirectory, 'snapshots');
  private readonly pagePayloadDirectory = path.join(this.baseDirectory, 'pages');
  private readonly snapshotStore = new JsonFileStore<RawCaptureRecord>(path.join(this.baseDirectory, 'snapshots.json'));
  private readonly pageStore = new JsonFileStore<RawPageCaptureRecord>(path.join(this.baseDirectory, 'pages.json'));
  private readonly captures: RawCaptureRecord[] = [];
  private readonly pages: RawPageCaptureRecord[] = [];

  async save(syncRunId: string, snapshot: SourceSnapshot): Promise<RawCaptureRecord> {
    const capturedAt = new Date().toISOString();
    const outputPath = await this.writeSnapshotToFile(syncRunId, capturedAt, snapshot);
    const record = {
      syncRunId,
      snapshot,
      capturedAt,
      outputPath,
    };

    this.captures.push(record);
    await this.snapshotStore.append(record);

    return record;
  }

  async savePage(input: SaveRawPageCaptureInput): Promise<RawPageCaptureRecord> {
    const capturedAt = new Date().toISOString();
    const contentType = this.extractContentType(input.page.headers);
    const contentHash = this.computeContentHash(input.page.body);
    const payloadDirectory = input.outputDirectory ?? this.pagePayloadDirectory;
    const outputPath = await this.writePayloadToFile(
      payloadDirectory,
      capturedAt,
      input.key,
      input.page.body,
      contentType,
    );
    const record: RawPageCaptureRecord = {
      key: input.key,
      sourceSystem: 'futbol-aragon',
      entityType: input.entityType,
      sourceUrl: input.sourceUrl,
      resolvedUrl: input.page.url,
      accessMode: input.accessMode,
      httpStatus: input.page.statusCode,
      contentType,
      contentHash,
      payload: {
        body: input.page.body,
        sizeBytes: Buffer.byteLength(input.page.body, 'utf8'),
        encoding: 'utf8',
        filePath: outputPath,
      },
      capturedAt,
      parseStatus: input.parseStatus ?? 'pending',
      errorMessage: input.errorMessage,
      outputPath,
      headers: input.page.headers,
      durationMs: input.page.durationMs,
    };

    this.pages.push(record);
    await this.pageStore.append(record);

    return record;
  }

  listPages(): RawPageCaptureRecord[] {
    return [...this.pages];
  }

  async findLatestPageByKey(key: string): Promise<RawPageCaptureRecord | null> {
    const pages = await this.pageStore.readAll();
    const matchingPages = pages.filter((page) => page.key === key);

    if (matchingPages.length === 0) {
      return null;
    }

    matchingPages.sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));

    return matchingPages[0] ?? null;
  }

  private async writeSnapshotToFile(syncRunId: string, capturedAt: string, snapshot: SourceSnapshot): Promise<string> {
    await mkdir(this.snapshotPayloadDirectory, { recursive: true });

    const outputPath = path.join(
      this.snapshotPayloadDirectory,
      `${capturedAt.replace(/:/g, '-')}--${this.sanitizeKey(syncRunId)}.json`,
    );

    await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

    return outputPath;
  }

  private async writePayloadToFile(
    outputDirectory: string,
    capturedAt: string,
    key: string,
    body: string,
    contentType?: string,
  ): Promise<string> {
    await mkdir(outputDirectory, { recursive: true });

    const extension = this.resolveFileExtension(contentType);
    const fileName = `${capturedAt.replace(/:/g, '-')}--${this.sanitizeKey(key)}.${extension}`;
    const outputPath = path.join(outputDirectory, fileName);

    await writeFile(outputPath, body, 'utf8');

    return outputPath;
  }

  private extractContentType(headers: FetchPageResult['headers']): string | undefined {
    const header = headers['content-type'];

    if (Array.isArray(header)) {
      return header[0];
    }

    return header;
  }

  private computeContentHash(payload: string): string {
    return createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  private resolveFileExtension(contentType?: string): string {
    if (contentType?.includes('application/json')) {
      return 'json';
    }

    if (contentType?.includes('text/html')) {
      return 'html';
    }

    return 'txt';
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
}
