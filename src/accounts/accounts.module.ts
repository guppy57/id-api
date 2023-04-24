import { Module } from '@nestjs/common';
import { KeychainsModule } from '../keychains/keychains.module';
import { PostageModule } from '../postage/postage.module';
import { PhotosModule } from '../photos/photos.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [KeychainsModule, PostageModule, PhotosModule, ApplicationsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
