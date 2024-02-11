import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import logger from '../utils/logger';
import { IAppRequest } from 'types/IAppRequest';

@Injectable()
export class AppAuthGaurd implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(req: IAppRequest): Promise<boolean> {
    const givenAppchain = req.headers.kreative_id_appchain;

    if (!givenAppchain) {
      logger.warn(
        'authenticate app middleware sent 400 due to missing appchain',
      );
      throw new HttpException(
        'appchain missing in headers',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (process.env.KREATIVE_APPCHAIN !== givenAppchain) {
      logger.warn(
        'authenticate app middleware sent 401 due to invalid appchain',
      );
      throw new HttpException('appchain invalid', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
