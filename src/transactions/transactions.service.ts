import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import { UpdateWalletBalanceDto } from '../accounts/accounts.dto';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from 'types/IResponse';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { CreateTransactionDto } from './transactions.dto';
import logger from '../../utils/logger';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  @Inject(AccountsService)
  private readonly accounts: AccountsService;

  // creates a new transaction and updates account balance
  async createTransaction(
    req: IAuthenticatedRequest,
    dto: CreateTransactionDto,
  ): Promise<IResponse> {
    let transaction: Transaction;

    try {
      // create a new transaction with prisma
      logger.info('prisma.transaction.create initiated');
      transaction = await this.prisma.transaction.create({
        data: {
          ksn: req.kreativeAccount.ksn,
          aidn: dto.aidn,
          type: dto.type,
          amount: dto.amount,
        },
      });
    } catch (error) {
      // handle any prisma errors
      logger.error({ message: 'prisma.transaction.create failed', error });
      handlePrismaErrors(error);
    }

    // update wallet balance in the designated account
    logger.info(`accounts.updateWalletBalance initiated for ksn: ${dto.ksn}`);
    const newWalletbalance = await this.accounts.updateWalletBalance({
      ksn: dto.ksn,
      type: dto.type,
      amount: dto.amount,
    } satisfies UpdateWalletBalanceDto);

    const payload: IResponse = {
      statusCode: 200,
      message: 'Transaction created and balance updated',
      data: { newWalletbalance, transaction },
    };

    logger.info({ message: 'create transaction succeeded', payload });
    return payload;
  }

  // gets all transactions for a certain account
  async getTransactionsByAccount(ksn: number): Promise<IResponse> {
    let transactions: Transaction[];

    try {
      // retrieves all transactions for an account
      logger.info(`prisma.transaction.findMany initiated where ksn: ${ksn}`);
      transactions = await this.prisma.transaction.findMany({
        where: { ksn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({ message: 'prisma.transaction.findMany failed', error });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Found all transactions',
      data: { transactions },
    };

    logger.info({ message: 'getTransactionsByAccount succeeded', payload });
    return payload;
  }
}
