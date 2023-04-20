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
  constructor(private transactionsService: TransactionsService) {}

  // TODO: all of these routes need to have a certain level of authentication with keychains
  // this way only authentication applications/users can create transactions
  // we could also just authenticate the applications that are making calls to the transactions API

  @Post('')
  async createTransaction(@Body() dto: CreateTransactionDto) {
    logger.info({ message: `POST /transactions initiated`, body: dto });
    return this.transactionsService.createTransaction(dto);
  }

  @Get(':ksn')
  async getTransactionsForAccount(@Param('ksn', ParseIntPipe) ksn: number) {
    logger.info(`GET /transactions/${ksn} initiated`);
    return this.transactionsService.getTransactionsByAccount(ksn);
  }
}
