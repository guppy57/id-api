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

  @Post('/verify-keychain')
  verifyKeychainForIdClient(@Body() req: VerifyCodeDto) {
    logger.info(`POST /v1/verify-keychain initiated`);
    wretch(`http://localhost:${PORT}/v1/keychains/verify`)
      .post({
        key: req.key,
        aidn: req.aidn,
        appchain: APPCHAIN,
      })
      .unauthorized((error) => {
        // unauthorized exception, meaning that the keychain is expired
        // relocates to signin page with the callback for 'Kreative ID Test'
        throw new HttpException(error.message, 401);
      })
      .forbidden((error) => {
        // aidn given is not the same as the one on the keychain
        // this is a weird error that would even happen, so we will just reauthenticate the user
        // relocates to signin page with the callback for 'Kreative ID Test'
        throw new HttpException(error.message, 403);
      })
      .internalError((error) => {
        // since there is something on the server side that isn't working reauthenticating wont work
        // instead we will redirect the user to an auth error page
        throw new HttpException(error.message, 500);
      })
      .notFound((error) => {
        // the keychain does not exist, meaning that the user has never signed in
        // relocates to signin page with the callback for 'Kreative ID Test'
        throw new HttpException(error.message, 404);
      })
      .json((response) => {
        const account = response.data.account;
        const keychain = response.data.keychain;
        return { account, keychain };
      })
      .catch((error) => {
        // some sort of unknown error, possibly on the client side itself
        throw new HttpException(error.message, 500);
      });
  }
}
