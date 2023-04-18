import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';
import { IAuthenticatedRequest } from '../types/IAuthenticatedRequest';

const PORT = process.env.PORT || 3000;

const AIDNs: number[] = [
  parseInt(process.env.HOST_AIDN),
  parseInt(process.env.MYKREATIVE_AIDN),
];

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly permissions: string[]) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(req: IAuthenticatedRequest): Promise<boolean> {
    let axiosResponse: AxiosResponse<any, any>;
    const key = req.headers['kreative_id_key'];
    const aidn = parseInt(req.headers['kreative_aidn']);
    const appchain = req.headers['kreative_appchain'];

    if (!key || !aidn || !appchain) {
      logger.warn(
        'authenticate user middleware sent 400 due to missing key, aidn',
      );
      throw new HttpException(
        'key, aidn, or appchain missing in headers',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      axiosResponse = await axios.post(
        `http://localhost:${PORT}/v1/keychains/verify`,
        {
          key,
          aidn,
          appchain,
        },
      );
    } catch (error) {
      if (!error.response) {
        logger.error({
          message: 'userAuth failed with unknown error (lv1)',
          error,
        });
        throw new HttpException(
          'Unknown Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { status, data } = error.response;

      if (status === 404) {
        logger.debug('userAuth failed with status 404, missing account or app');
        throw new HttpException(data.message, HttpStatus.BAD_REQUEST);
      } else if (status === 401) {
        logger.debug('userAuth failed with status 401, expired keychain');
        throw new HttpException(data.message, HttpStatus.UNAUTHORIZED);
      } else if (status === 403) {
        logger.debug('userAuth failed with status 403, aidn mismatch');
        throw new HttpException(data.message, HttpStatus.FORBIDDEN);
      } else {
        logger.error('userAuth failed with status 500, internal server error');
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    const payload = axiosResponse.data.data;
    const account: any = payload.account;
    const userPermissions: string[] = account.permissions;
    const givenAidn = parseInt(payload.keychain.aidn);

    if (!userPermissions.some((p) => this.permissions.includes(p))) {
      logger.debug({
        message: 'userAuth sent 401',
        userPermissions,
        requiredPermissions: this.permissions,
      });
      throw new HttpException(
        'Insufficient user permissions',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!AIDNs.includes(givenAidn)) {
      logger.debug({
        message: 'userAuth sent 403',
        userAidn: givenAidn,
        applications: AIDNs,
      });
      throw new HttpException(
        'Keychain outside of available applications',
        HttpStatus.FORBIDDEN,
      );
    }

    req.kreativeAccount = account;
    logger.debug({ message: 'userAuth passed', account });

    return true;
  }
}
