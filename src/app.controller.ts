import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import logger from '../utils/logger';

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
