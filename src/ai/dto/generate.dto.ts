import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10_000)
  prompt!: string;
}
