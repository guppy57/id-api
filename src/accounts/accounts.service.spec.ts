import { Test, TestingModule } from '@nestjs/testing';
import { KeychainsModule } from '../keychains/keychains.module';
import { PostageModule } from '../postage/postage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PhotosModule } from '../photos/photos.module';
import { ApplicationsModule } from '../applications/applications.module';
import { AccountsService } from './accounts.service';

describe('Accounts Service', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsService],
      imports: [
        KeychainsModule,
        PostageModule,
        PrismaModule,
        PhotosModule,
        ApplicationsModule,
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
