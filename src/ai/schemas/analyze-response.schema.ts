import { IsArray, IsIn, IsString, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export type Severity = 'info' | 'warning' | 'error';

export class AnalyzeResponseSchema {
  @IsString()
  analysis!: string;

  @IsArray()
  @IsString({ each: true })
  suggestions!: string[];

  @IsIn(['info', 'warning', 'error'])
  severity!: Severity;
}

export function validateAnalyzeResponse(
  raw: unknown,
): AnalyzeResponseSchema | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const instance = plainToInstance(AnalyzeResponseSchema, raw);
  const errors = validateSync(instance, {
    forbidUnknownValues: false,
    skipMissingProperties: false,
  });

  return errors.length === 0 ? instance : null;
}
