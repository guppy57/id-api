import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../utils/logger';
import { IAuthenticatedRequest } from '../types/IAuthenticatedRequest';

const requiredPermissions: string[] = [
  'KREATIVE_ID_ADMIN',
  'KREATIVE_ID_DEVELOPER',
];

const PORT = process.env.PORT || 3000;

@Injectable()
export class AuthenticateUserMiddleware implements NestMiddleware {
  use(req: IAuthenticatedRequest, res: Response, next: NextFunction) {
    // retrieve key and aidn from the request headers
    const key = req.headers['kreative_id_key'];
    const aidnString = req.headers['kreative_aidn'];
    const appchain = req.headers['kreative_appchain'];

    // parses the AIDN header as string to an integer
    // TODO make this implementation a lot better
    // @ts-ignore some sort of unassignable error is throw so we ignore the typescript error
    const aidn = parseInt(aidnString);

    if (!key || !aidn || !appchain) {
      // the neccessary headers are not in the request, so middleware should fail
      logger.warn(
        'authenticate user middleware sent 400 due to missing key, aidn',
      );
      res.status(400).send({
        statusCode: 400,
        message: 'key, aidn, or appchain missing in headers',
      });
    } else {
      // verify the key using an AXIOS request (not using the Keychain Service)
      axios
        .post(`http://localhost:${PORT}/v1/keychains/verify`, {
          key,
          aidn,
          appchain,
        })
        .then((response) => {
          // status code is between 200-299
          if (response.data.statusCode === 200) {
            // verifies that the user has the neccessary permissions
            const permissions: string[] =
              response.data.data.account.permissions;

            // checks to see if the user's permissions include the ones required
            // in other Kreative applications this will have to be manually configured based on number of permissions
            // we can't just say the user isn't authenticated, because they are, they just don't have the correct permissions
            // therefore we will throw a ForbiddenException with a custom message about permissions
            if (
              !(
                permissions.includes(requiredPermissions[0]) ||
                permissions.includes(requiredPermissions[1])
              )
            ) {
              // user does not have the correct permissions to continue with the request
              logger.warn({
                message: 'authenticate middleware send 401 error',
                userPermissions: permissions,
                requiredPermissions,
              });
              res.status(403).send({
                statusCode: 403,
                message: 'user doesnt have correct permissions',
              });
            } else {
              // checks to see if the AIDN on the keychain is the same AIDN as our application (Kreative ID non-test)
              // this is checking to see if the user on the client is sending through a keychain that was
              // created when they tried signing into this application
              // parses the environment variable for the HOST_AIDN
              const HOST_AIDN: number = parseInt(process.env.HOST_AIDN);

              if ((response.data.data.keychain.aidn as number) !== HOST_AIDN) {
                // sends back an UnauthorizedException
                logger.warn({
                  message: 'authenticate middleware sent 401 error',
                  hostAidn: HOST_AIDN,
                  givenAidn: response.data.data.keychain.aidn,
                });
                res.status(401).send({
                  statusCode: 401,
                  message: 'keychain.aidn does not match HOST_AIDN',
                });
              } else {
                const account: any = response.data.data.account;
                req.kreativeAccount = account;
                logger.info({
                  message: 'added account object to request body in middleware',
                  account,
                });

                logger.info('authenticate middleware passed');
                next();
              }
            }
          }
        })
        .catch((error) => {
          // status code is not between 200-299
          const statusCode = error.response.status;

          if (statusCode === 404) {
            // NotFoundException, either account or key isn't found
            // either way something is majorly incorrect so we have to throw an error
            logger.warn({
              message:
                'authenticate user middleware failed with 404 error for missing account or application',
              error,
            });
            res.status(404).send({
              statusCode: 404,
              message: error.response.data.message,
            });
          } else if (statusCode === 401) {
            // UnauthorizedException (the keychain is expired)
            // since the user is trying to make a request with an expired keychain we throw another UnauthorizedException
            logger.warn({
              message:
                'authenticate user middleware failed with 401 error for expired keychain',
              error,
            });
            res
              .status(401)
              .send({ statusCode: 401, message: 'expired keychain' });
          } else if (statusCode === 403) {
            // ForbiddenException (aidn mismatch)
            logger.warn({
              message:
                'authenticate user middleware failed with 403 error for aidn mismatch',
              error,
            });
            res.status(403).send({ statusCode: 403, message: 'aidn mismatch' });
          } else if (statusCode === 500) {
            // InternalServerException
            logger.warn({
              message:
                'authenticate user middleware failed with 500 error for internal server error',
              error,
            });
            res
              .status(500)
              .send({ statusCode: 500, message: 'error from server side' });
          } else {
            // some unknown error through unknown status code
            logger.error({
              message:
                'authenticate user middleware failed with 500 error for unknown error',
              error,
            });
            res.status(500).send({ statusCode: 500, message: 'unknown error' });
          }
        });
    }
  }
}
