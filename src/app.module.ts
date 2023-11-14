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
import { PhotosModule } from './photos/photos.module';

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
    if (process.env.ENVIRONMENT !== 'development') {
      console.log('Sentry is enabled!');
      consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
    }
  }
}
