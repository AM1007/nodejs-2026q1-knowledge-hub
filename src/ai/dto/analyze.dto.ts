import { IsEnum, IsOptional } from 'class-validator';
import { AnalyzeTask } from '../prompts';

export class AnalyzeArticleDto {
  @IsOptional()
  @IsEnum(['review', 'bugs', 'optimize', 'explain'])
  task?: AnalyzeTask;
}
