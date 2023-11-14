import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CreateTransactionDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';
import logger from '../../utils/logger';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('')
  async createTransaction(@Body() dto: CreateTransactionDto) {
    logger.info({ message: 'POST /transactions initiated', body: dto });
    return this.transactionsService.createTransaction(dto);
  }

  @Get(':ksn')
  async getTransactionsForAccount(@Param('ksn', ParseIntPipe) ksn: number) {
    logger.info(`GET /transactions/${ksn} initiated`);
    return this.transactionsService.getTransactionsByAccount(ksn);
  }
}
