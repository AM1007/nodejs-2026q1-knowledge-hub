import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../common';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  oldPassword?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  newPassword?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
