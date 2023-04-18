import { NestModule, RequestMethod } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { KeychainsModule } from './keychains/keychains.module';
import { ApplicationsModule } from './applications/applications.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostageModule } from './postage/postage.module';
import { AppController } from './app.controller';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

import { SentryModule } from './sentry/sentry.module';
import { AuthenticateUserMiddleware } from '../middleware/authenticateUser';
import { ApplicationsController } from './applications/applications.controller';
import { AccountsController } from './accounts/accounts.controller';
import { PhotosModule } from './photos/photos.module';
import { PhotosController } from './photos/photos.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: true,
    }),
    AccountsModule,
    TransactionsModule,
    KeychainsModule,
    ApplicationsModule,
    PrismaModule,
    PostageModule,
    SentryModule,
    PhotosModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // sentry specific middlware
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
    consumer
      .apply(AuthenticateUserMiddleware)
      .exclude(
        { path: 'v1/applications/:aidn', method: RequestMethod.GET },
        {
          path: 'v1/applications/:aidn/appchain/verify',
          method: RequestMethod.GET,
        },
        {
          path: 'v1/accounts/signin',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/accounts/signup',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/accounts/:ksn',
          method: RequestMethod.GET,
        },
        {
          path: 'v1/accounts/resetCode/send',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/accounts/resetCode/verify',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/accounts/:ksn/resetPassword',
          method: RequestMethod.POST,
        },
      )
      .forRoutes(ApplicationsController, AccountsController, PhotosController);
  }
}
