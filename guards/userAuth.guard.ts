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
import { RolesOnAccounts } from '@prisma/client';
import compareRoles from '../utils/compareRoles';

const PORT = process.env.PORT ?? 3000;

const AIDNs: number[] = [
  parseInt(process.env.HOST_AIDN),
  parseInt(process.env.MYKREATIVE_AIDN),
  289473, // Kreative DocuVet AIDN
];

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly permissions: string[]) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(req: IAuthenticatedRequest): Promise<boolean> {
    let axiosResponse: AxiosResponse<any, any>;
    const key = req.headers.kreative_id_key;
    const aidn = parseInt(req.headers.kreative_aidn);

    if (!key || !aidn) {
      logger.warn(
        'authenticate user middleware sent 400 due to missing key, aidn',
      );
      throw new HttpException(
        'key or aidn missing in headers',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      axiosResponse = await axios.post(
        `http://localhost:${PORT}/v1/keychains/verify`,
        {
          key,
          aidn,
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
    const userRoles: RolesOnAccounts[] = account.roles;
    const givenAidn = parseInt(payload.keychain.aidn);

    logger.info('userAuth attempting to verify roles for user in userAuth');
    const hasRoles: boolean = await compareRoles(userRoles, this.permissions);

    if (!hasRoles) {
      logger.debug({
        message: 'userAuth sent 401',
        userRoles,
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
    req.requestingAIDN = givenAidn;
    logger.debug({ message: 'userAuth passed', account });

    return true;
  }
}
