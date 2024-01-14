import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class NewApplicationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  callbackUrl: string;

  @IsNotEmpty()
  @IsUrl()
  homepage: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  baseRole: string;

  logoUrl?: string;
  iconUrl?: string;
}

export class UpdateApplicationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  callbackUrl: string;

  @IsNotEmpty()
  @IsUrl()
  homepage: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  baseRole: string;

  @IsNotEmpty()
  logoUrl: string;

  @IsNotEmpty()
  iconUrl: string;
}

export class AidnDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;
}