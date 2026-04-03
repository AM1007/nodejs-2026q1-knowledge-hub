import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ArticleStatus } from '../../common';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @IsUUID()
  @IsOptional()
  authorId?: string | null;

  @IsUUID()
  @IsOptional()
  categoryId?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
