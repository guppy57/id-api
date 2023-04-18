import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import {
  SigninDto,
  SignupDto,
  UpdateAccountDto,
  VerifyCodeDto,
  ResetPasswordDto,
  SendCodeDto,
  UpdatePermissionsDto,
} from './accounts.dto';
import logger from '../../utils/logger';
import { IResponse } from '../../types/IResponse';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import { IAuthenticatedRequest } from '../../types/IAuthenticatedRequest';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  signup(@Body() dto: SignupDto): Promise<IResponse> {
    logger.info({ message: `POST /accounts/signup initiated`, body: dto });
    return this.accountsService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SigninDto): Promise<IResponse> {
    logger.info({ message: `POST /accounts/signin initiated`, body: dto });
    return this.accountsService.signin(dto);
  }

  @Post('update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  updateAccount(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: UpdateAccountDto,
  ): Promise<IResponse> {
    logger.info({ message: `POST /accounts/update initiated`, body: dto });
    return this.accountsService.updateAccount(req, dto);
  }

  @Post('update/permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  updatePermissions(@Body() dto: UpdatePermissionsDto): Promise<IResponse> {
    logger.info({
      message: `POST /accounts/update/permissions initiated`,
      body: dto,
    });
    return this.accountsService.updatePermissions(dto);
  }

  @Get(':ksn')
  @HttpCode(HttpStatus.OK)
  getAccount(@Param('ksn', ParseIntPipe) ksn: number): Promise<IResponse> {
    logger.info(`GET /accounts/${ksn} initiated`);
    return this.accountsService.getAccount(ksn);
  }

  @Post('resetCode/send')
  @HttpCode(HttpStatus.OK)
  async sendResetCode(@Body() dto: SendCodeDto): Promise<IResponse> {
    logger.info({
      message: `POST /accounts/resetCode/send initiated`,
      body: dto,
    });
    return this.accountsService.sendResetCode(dto);
  }

  @Post(':ksn/resetCode/verify')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
}
