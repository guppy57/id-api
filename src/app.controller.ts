import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import wretch from 'wretch';
import logger from '../utils/logger';

const PORT = process.env.PORT || 3000;
const APPCHAIN = process.env.APPCHAIN;

class VerifyCodeDto {
  key: string;
  aidn: number;
}

@Controller('')
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  async home(): Promise<string> {
    logger.info(`GET /v1 initiated within app controller`);
    return "Welcome to Kreative ID API, friend. It's good to see you.";
  }

  @Get('throw')
  throwError(): string {
    logger.info(`GET /v1/throw initiated (sentry test method)`);
    throw new HttpException({ message: 'Sample Error' }, 500);
  }
}
