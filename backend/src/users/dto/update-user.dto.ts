import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  alias?: string;

  // Accept base64 data URLs (uploaded files) or regular URLs
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.profileImageUrl?.startsWith('data:'))
  @IsUrl()
  @ValidateIf((o) => !o.profileImageUrl?.startsWith('data:'))
  @MaxLength(500)
  profileImageUrl?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
