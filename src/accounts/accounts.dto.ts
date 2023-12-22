import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;
}

export class SigninDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  @IsBoolean()
  rememberMe: boolean;
}

export class UpdateAccountDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  profilePicture: string;

  @IsOptional()
  password: string;
}

export class UpdateWalletBalanceDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(8)
  ksn: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class UpdateAvatarDto {
  @IsNotEmpty()
  @IsUrl()
  photoUrl: string;
}

export class SendCodeDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyCodeDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  code: number;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  resetCode: number;
}
