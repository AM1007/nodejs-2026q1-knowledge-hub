import { IsEnum, IsOptional } from 'class-validator';
import { SummaryLength } from '../prompts';

export class SummarizeArticleDto {
  @IsOptional()
  @IsEnum(['short', 'medium', 'detailed'])
  maxLength?: SummaryLength;
}
