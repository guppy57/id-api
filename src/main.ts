import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import logger from '../utils/logger';

// the port that the id-api should boot on
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // adds cross origin reference abilities, including exposing headers
  // we have to add new domain names for each service that needs to access Kreative ID
  app.enableCors({
    exposedHeaders: ['KREATIVE_ID_KEY', 'KREATIVE_AIDN', 'KREATIVE_APPCHAIN'],
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://id.kreativeusa.com',
      'https://id.kreativeusa.com',
      'http://kreativehyperlink.com',
      'https://kreativehyperlink.com',
      'http://api.kreativehyperlink.com',
      'https://api.kreativehyperlink.com',
      'http://my.kreativeusa.com',
      'https://my.kreativeusa.com',
      'http://kreativetemplates.co',
      'https://kreativetemplates.co',
      'http://api.kreativetemplates.co',
      'https://api.kreativetemplates.co',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE', 'OPTIONS'],
    credentials: true,
  });

  // removes any data from request bodies that don't fit the DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // adds /v1 before any route, used for API versioning
  app.setGlobalPrefix('/v1');

  logger.info(
    `ID-API starting on port: ${PORT} in environment: ${process.env.NODE_ENV}`,
  );
  await app.listen(PORT);
}
bootstrap();
