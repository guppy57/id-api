import { Test, TestingModule } from '@nestjs/testing';
import { PostageService } from '../postage/postage.service';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { KeychainsService } from '../keychains/keychains.service';
import { PhotosService } from '../photos/photos.service';
import { ApplicationsService } from '../applications/applications.service';
import { RolesService } from '../roles/roles.service';

describe('Transactions Controller', () => {
  let controller: TransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
        PrismaService,
        AccountsService,
        PostageService,
        KeychainsService,
        PhotosService,
        ApplicationsService,
        RolesService,
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
