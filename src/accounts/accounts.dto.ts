import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
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
  firstName: string;

  @IsNotEmpty()
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
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  profilePicture: string;

  @IsString()
  password?: string;
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
  type: string;
}

export class UpdatePermissionsDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  appchain: string;

  @IsNotEmpty()
  @IsArray()
  newPermissions: Array<string>;
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
  resetCode: number;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  password: string;
}
