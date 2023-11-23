import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { CreateTransactionDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import logger from '../../utils/logger';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async createTransaction(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ) {
    logger.info({ message: 'POST /transactions initiated', body: dto });
    return this.transactionsService.createTransaction(req, dto);
  }

  @Get(':ksn')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async getTransactionsForAccount(
    @Req() req: IAuthenticatedRequest,
    @Param('ksn', ParseIntPipe) ksn: number,
  ) {
    const authnKSN = req.kreativeAccount.ksn;

    if (authnKSN !== ksn) {
      logger.error({
        message: `GET /transactions/${ksn} failed`,
        error: 'Unauthorized',
      });
      throw new UnauthorizedException('ksn mismatch');
    }

    logger.info(`GET /transactions/${ksn} initiated`);
    return this.transactionsService.getTransactionsByAccount(ksn);
  }
}
