import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateTransactionDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import logger from '../../utils/logger';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async createTransaction(@Body() dto: CreateTransactionDto) {
    logger.info({ message: 'POST /transactions initiated', body: dto });
    return this.transactionsService.createTransaction(dto);
  }

  @Get(':ksn')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async getTransactionsForAccount(@Param('ksn', ParseIntPipe) ksn: number) {
    logger.info(`GET /transactions/${ksn} initiated`);
    return this.transactionsService.getTransactionsByAccount(ksn);
  }
}
