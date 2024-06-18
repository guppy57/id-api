import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class KeychainDto {
  @IsNotEmpty()
  @IsNumber()
  ksn: number;

  @IsNotEmpty()
  @IsNumber()
  aidn: number;

  @IsNotEmpty()
  @IsBoolean()
  rememberMe: boolean;

  @IsString()
  @IsOptional()
  environment?: string;
}

export class VerifyKeychainDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  @IsString()
  key: string;
}

export class CloseKeychainDto {
  @IsNotEmpty()
  @IsString()
  key: string;
}
