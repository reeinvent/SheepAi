import { z } from "zod";

export const BaseIngestedRecordSchema = z.object({
  dataSource: z.string().min(1),
  summary: z.string().min(1),
  timestamp: z.iso.datetime({ offset: true }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BaseIngestedRecord = z.infer<typeof BaseIngestedRecordSchema>;

export class IngestorValidationError extends Error {
  constructor(
    public readonly dataSource: string,
    public readonly index: number,
    public readonly zodError: z.ZodError,
  ) {
    const detail = zodError.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    super(`[${dataSource}] record ${index} failed validation: ${detail}`);
    this.name = "IngestorValidationError";
  }
}

export abstract class Ingestor<T extends BaseIngestedRecord = BaseIngestedRecord> {
  abstract readonly dataSource: string;
  protected abstract readonly schema: z.ZodType<T>;

  protected abstract fetch(): Promise<unknown[]>;

  async run(): Promise<T[]> {
    const raw = await this.fetch();
    return raw.map((record, index) => this.validate(record, index));
  }

  protected validate(record: unknown, index: number): T {
    const parsed = this.schema.safeParse(record);
    if (!parsed.success) {
      throw new IngestorValidationError(this.dataSource, index, parsed.error);
    }
    if (parsed.data.dataSource !== this.dataSource) {
      throw new Error(
        `[${this.dataSource}] record ${index} has mismatched dataSource "${parsed.data.dataSource}"`,
      );
    }
    return parsed.data;
  }
}
