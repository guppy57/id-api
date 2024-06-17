import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Account, Keychain, Application } from '@prisma/client';
import { nanoid } from 'nanoid';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { KeychainDto, VerifyKeychainDto } from './keychains.dto';
import { IResponse } from 'types/IResponse';
import * as moment from 'moment';
import { Moment } from 'moment';
import logger from '../../utils/logger';
import { createHmac } from 'crypto';

const SECRET = process.env.SUPER_SECRET;

@Injectable({})
export class KeychainsService {
  constructor(private readonly prisma: PrismaService) {}

  // returns new keychain after being added to the database
  async createKeychain(dto: KeychainDto): Promise<Keychain> {
    let keychain: Keychain;

    //setup variables for the data of the jwt
    // creates moment instances for createdAt and expiresAt
    const createdAtMoment: Moment = moment(new Date());
    const expiresAtMoment: Moment = dto.rememberMe
      ? createdAtMoment.add(30, 'days')
      : createdAtMoment.add(1, 'hours');

    // converts moment instances to string datetime objects
    const createdAt: string = createdAtMoment.format();
    const expiresAt: string = expiresAtMoment.format();

    // creates a secure has to increase security of the JWT
    const secureHash: string = nanoid();

    // gets claims based on the application
    let devClaimsUrl: string;
    let prodClaimsUrl: string;

    try {
      logger.info(
        `prisma.application.findUnique initiated for aidn: ${dto.aidn}`,
      );
      const application: Application = await this.prisma.application.findUnique(
        {
          where: { aidn: dto.aidn },
        },
      );

      devClaimsUrl = `${application.devClaimsUrl}/${dto.ksn}`;
      prodClaimsUrl = `${application.prodClaimsUrl}/${dto.ksn}`;
    } catch (error) {
      logger.error({ message: 'prisma.application.findUnique failed', error });
      handlePrismaErrors(error);
    }

    // make a get request to the claims url
    let claimsJson: any;

    if ((devClaimsUrl || prodClaimsUrl) && dto.aidn === 289473) {
      const isProd = dto.environment === 'production';
      const key = isProd
        ? process.env.DOCUVET_API_KEY_PROD
        : process.env.DOCUVET_API_KEY_DEV;

      const claims: any = await fetch(isProd ? prodClaimsUrl : devClaimsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Docuvet-Api-Key': key,
        },
      });

      // if the claims request fails, throw an error
      if (!claims.ok) {
        logger.error('claims request failed');
        throw new InternalServerErrorException('Claims request failed');
      }

      // if the claims request is successful, parse the response
      claimsJson = await claims.json();
    }

    // create new JWT 'key'
    const key = jwt.sign(
      {
        ksn: dto.ksn,
        aidn: dto.aidn,
        claims: claimsJson,
        createdAt,
        expiresAt,
        secureHash,
      },
      SECRET,
    );

    try {
      // create new keychain in the database
      logger.info(
        `prisma.keychain.create initiated for ksn: ${dto.ksn} and aidn: ${dto.aidn}`,
      );
      keychain = await this.prisma.keychain.create({
        data: { ksn: dto.ksn, aidn: dto.aidn, key },
      });
    } catch (error) {
      // handles any errors by prisma
      logger.error({ message: 'prisma.keychain.create failed', error });
      handlePrismaErrors(error);
    }

    // returns just the jwt from the keychain object
    logger.info({ message: 'new keychain created successful', key });
    return keychain;
  }

  // retrieves a list of all keychains
  async getAllKeychains(): Promise<IResponse> {
    let keychains: Keychain[];

    try {
      // gets all keychains with prisma
      logger.info('prisma.keychain.findMany initiated');
      keychains = await this.prisma.keychain.findMany();
    } catch (error) {
      // hanles any prisma errors
      logger.error({ message: 'prisma.keychain.findMany failed', error });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Keychains found',
      data: { keychains },
    };

    logger.info({ message: 'getAllKeychains succeeded', payload });
    return payload;
  }

  // decrypts the keychain, checks expiration, and returns verification status
  // if the keychain is found to be expired, update the expired field to 'true'
  async verifyKeychain(dto: VerifyKeychainDto): Promise<IResponse> {
    let keychain: Keychain;
    let decodedKey: any;

    try {
      // finds the keychain from the key
      // as one ksn may have many keys, we can't search from that
      logger.info({
        message: 'prisma.keychain.findUnique initiated with key',
        key: dto.key,
      });
      keychain = await this.prisma.keychain.findUnique({
        where: { key: dto.key },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({ message: 'prisma.keychain.findUnique failed', error });
      handlePrismaErrors(error);
    }

    if (keychain === null) {
      // handles the case where the keychain itself is not found
      // this could be through an attack or an incorrectly typed in key
      logger.error('keychain not found in verify keychain');
      throw new NotFoundException('keychain not found');
    }

    // checks the expiration field
    if (keychain.expired) {
      logger.info('keychain found to be expired');
      throw new UnauthorizedException('keychain has expired from field');
    }

    // decodes the key (jwt)
    jwt.verify(keychain.key, SECRET, (error: any, decoded: any) => {
      // throws error if the key somehow uses the 'wrong' token
      if (error) {
        logger.error('jwt.verify is using WRONG token for decoding');
        throw new NotFoundException();
      }
      logger.info('jwt.verify passed successful and key was decoded');
      decodedKey = decoded;
    });

    // checks the expiration in the payload itself
    const expired: boolean = moment(decodedKey.expiresAt).isSameOrBefore(
      moment(),
    );

    if (expired) {
      logger.debug('keychain is expired within its payload');
      try {
        // update the keychain's expired field to also reflect true
        logger.info(`prisma.keychain.update initiated for id: ${keychain.id}`);
        await this.prisma.keychain.update({
          where: { id: keychain.id },
          data: { expired: true },
        });
      } catch (error) {
        // handles all prisma errors
        logger.error({ message: 'prisma.keychain.update failed', error });
        handlePrismaErrors(error);
      }

      // throw error to kill the process and return failed verification
      logger.error('UnauthorizedException thrown since keychain is expired');
      throw new UnauthorizedException('keychain has expired from payload');
    }

    // verify the aidn's match
    if (!(dto.aidn === decodedKey.aidn)) {
      logger.error(
        `aidn mismatch decodedKey.aidn: ${decodedKey.aidn} and aidn: ${dto.aidn}`,
      );
      throw new ForbiddenException('aidn mismatch');
    }

    // removes expired, the jwt from the keychain object
    // it doesn't seem like there would be any reason to send the key back to the client
    // as they already have a copy of it that IS valid and not expired
    logger.info('sensitive info for keychain being deleted');
    delete keychain.key;
    delete keychain.expired;

    // finds the account details for user attached to the keychain
    // this method should NOT throw any errors, as the only possible ones could be some sort of
    // error with prisma, or with nest.js dependency management (circular dependencies)
    let account: Account;

    try {
      logger.info(
        `prisma.account.findUnique initiated for ksn: ${keychain.ksn}`,
      );
      account = await this.prisma.account.findUnique({
        where: { ksn: keychain.ksn },
        include: {
          roles: true,
        },
      });
    } catch (error) {
      // handles prisma errors
      logger.error({ message: 'prisma.account.findUnique failed', error });
      handlePrismaErrors(error);
    }

    if (account === null || account === undefined) {
      logger.error('no account was found on keychain');
      throw new NotFoundException('Account not found');
    }

    // removes sensitive information
    logger.info('sensitive info for account being deleted');
    delete account.bpassword;
    delete account.resetCode;

    const claims = decodedKey.claims ? decodedKey.claims : {};

    const payload: IResponse = {
      statusCode: 200,
      message: 'Keychain is valid',
      data: {
        keychain,
        account,
        claims,
      },
    };

    if (decodedKey.aidn === 289473) {
      const secretKey = process.env.DOCUVET_INTERCOM_SECRET;
      const intercomHash = createHmac('sha256', secretKey)
        .update(account.ksn.toString())
        .digest('hex');
      payload.data.docuvetIntercomHash = intercomHash;
    }

    logger.info({ message: 'verify keychain succeeded', payload });
    return payload;
  }

  // expires the keychain
  async closeKeychain(key: string): Promise<IResponse> {
    let keychain: any;

    console.log(key);

    try {
      logger.info(`prisma.keychain.update initiated for key: ${key}`);
      keychain = await this.prisma.keychain.update({
        where: { key },
        data: { expired: true },
      });
    } catch (error) {
      console.log(error);
      // handles any prisma errors that come up
      logger.error({ message: 'prisma.keychain.update failed', error });
      handlePrismaErrors(error);
    }

    if (keychain) {
      const payload = {
        statusCode: 200,
        message: 'Keychain closed',
      };

      logger.info({ message: 'close keychain passed', payload });
      return payload;
    } else {
      // for some reason the keychain doesn't return from prisma
      logger.error('keychain not returning from prisma');
      throw new InternalServerErrorException('Close keychain failed');
    }
  }
}
