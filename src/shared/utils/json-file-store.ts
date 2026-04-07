// Provides a tiny JSON file store for spike persistence without introducing a database.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class JsonFileStore<T extends Record<string, unknown>> {
  constructor(private readonly filePath: string) {}

  async readAll(): Promise<T[]> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as unknown;

      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async writeAll(items: T[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  }

  async append(item: T): Promise<T> {
    const items = await this.readAll();

    items.push(item);
    await this.writeAll(items);

    return item;
  }

  async upsertMany(items: T[], getKey: (item: T) => string): Promise<T[]> {
    const existing = await this.readAll();
    const merged = new Map(existing.map((item) => [getKey(item), item]));

    for (const item of items) {
      merged.set(getKey(item), item);
    }

    const values = Array.from(merged.values());
    await this.writeAll(values);

    return items;
  }

  async upsertOne(item: T, getKey: (entry: T) => string): Promise<T> {
    await this.upsertMany([item], getKey);

    return item;
  }
}
