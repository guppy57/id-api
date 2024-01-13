import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsString,
  IsBoolean,
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
}

export class VerifyKeychainDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  @IsString()
  key: string;

  appchain?: string;
}

export class CloseKeychainDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  @IsString()
  appchain: string;
}
