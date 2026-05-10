import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ReindexDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyPublished?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  articleIds?: string[];
}
