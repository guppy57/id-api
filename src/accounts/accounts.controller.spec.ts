import { Test, TestingModule } from '@nestjs/testing';
import { KeychainsService } from '../keychains/keychains.service';
import { PostageService } from '../postage/postage.service';
import { PrismaService } from '../prisma/prisma.service';
import { PhotosService } from '../photos/photos.service';
import { ApplicationsService } from '../applications/applications.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { RolesService } from '../roles/roles.service';

describe('Accounts Controller', () => {
  let controller: AccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        AccountsService,
        PostageService,
        PrismaService,
        KeychainsService,
        PhotosService,
        ApplicationsService,
        RolesService,
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
