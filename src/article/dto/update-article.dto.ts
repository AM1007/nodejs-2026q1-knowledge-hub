import { IsString, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ArticleStatus } from '../../common';

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @IsUUID()
  @IsOptional()
  categoryId?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
