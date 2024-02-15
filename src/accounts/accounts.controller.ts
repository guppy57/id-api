import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import {
  SigninDto,
  SignupDto,
  UpdateAccountDto,
  VerifyCodeDto,
  ResetPasswordDto,
  SendCodeDto,
  UpdateAvatarDto,
  AccountListDto,
} from './accounts.dto';
import logger from '../../utils/logger';
import { IResponse } from '../../types/IResponse';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import { AppAuthGaurd } from '../../guards/appAuth.guard';
import { IAuthenticatedRequest } from '../../types/IAuthenticatedRequest';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<IResponse> {
    logger.info({ message: 'POST /accounts/signup initiated', body: dto });
    return this.accountsService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SigninDto): Promise<IResponse> {
    logger.info({ message: 'POST /accounts/signin initiated', body: dto });
    return this.accountsService.signin(dto);
  }

  @Post('update')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  updateAccount(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: UpdateAccountDto,
  ): Promise<IResponse> {
    logger.info({ message: 'POST /accounts/update initiated', body: dto });
    return this.accountsService.updateAccount(req, dto);
  }

  @Post('update/avatar')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  updateAvatar(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: UpdateAvatarDto,
  ): Promise<IResponse> {
    logger.info({
      message: 'POST /accounts/update/avatar initiated',
      body: dto,
    });
    return this.accountsService.updateAvatar(req, dto);
  }

  @Get('')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  getAccount(@Req() req: IAuthenticatedRequest): Promise<IResponse> {
    logger.info(`GET /accounts initiated`);
    return this.accountsService.getAccount(req);
  }

  @Get(':email')
  @UseGuards(new AppAuthGaurd())
  getAccountByEmail(@Param('email') email: string): Promise<IResponse> {
    logger.info(`GET /accounts/${email} initiated`);
    return this.accountsService.getAccountByEmail(email);
  }

  @Post('list')
  @UseGuards(new AppAuthGaurd())
  getAccounts(@Body() body: AccountListDto): Promise<IResponse> {
    logger.info(`GET /accounts/list initiated`);
    return this.accountsService.getAccountList(body.ksnList);
  }

  @Post('resetCode/send')
  async sendResetCode(@Body() dto: SendCodeDto): Promise<IResponse> {
    logger.info({
      message: 'POST /accounts/resetCode/send initiated',
      body: dto,
    });
    return this.accountsService.sendResetCode(dto);
  }

  @Post(':ksn/resetCode/verify')
  async verifyResetCode(
    @Param('ksn', ParseIntPipe) ksn: number,
    @Body() dto: VerifyCodeDto,
  ): Promise<IResponse> {
    logger.info({
      message: `POST /accounts/${ksn}/resetCode/verify initiated`,
      body: dto,
    });
    return this.accountsService.verifyResetCode(ksn, dto);
  }

  @Post(':ksn/resetPassword')
  async resetPassword(
    @Param('ksn', ParseIntPipe) ksn: number,
    @Body() dto: ResetPasswordDto,
  ) {
    logger.info({
      message: `POST /accounts/${ksn}/resetPassword initiated`,
      body: dto,
    });
    return this.accountsService.resetPassword(ksn, dto);
  }

  @Post('verify_code/send')
  async sendEmailVerificationCode(
    @Body() dto: SendCodeDto,
  ): Promise<IResponse> {
    logger.info({
      message: 'POST /accounts/verify_code/send initiated',
      body: dto,
    });
    return this.accountsService.sendEmailVerificationCode(dto.email);
  }

  @Post(':ksn/verify_code/verify')
  async verifyEmailVerificationCode(
    @Param('ksn', ParseIntPipe) ksn: number,
    @Body() dto: VerifyCodeDto,
  ): Promise<IResponse> {
    logger.info({
      message: `POST /accounts/${ksn}/verify_code/verify initiated`,
      body: dto,
    });
    return this.accountsService.verifyEmailVerificationCode(ksn, dto.code);
  }
}
