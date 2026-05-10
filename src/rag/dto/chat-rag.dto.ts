import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ChatRagDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  @IsUUID('4')
  conversationId?: string;
}
