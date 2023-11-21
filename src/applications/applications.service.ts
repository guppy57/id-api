import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import { Application, Keychain } from '@prisma/client';
import { customAlphabet, nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import { IApplication } from '../../types/IApplication';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import {
  NewApplicationDto,
  UpdateApplicationDto,
  VerifyAppchainDto,
} from './applications.dto';
import logger from '../../utils/logger';
import { verifyAppchain } from '../../utils/verifyAppchain';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  // creates a new, unique application id number
  async generateAIDN(): Promise<number> {
    let unique = false;
    let newAIDN = 0;
    // create new 'nanoid' function with custom parameters
    const nanoid = customAlphabet('123456789', 6);
    // loop to create a compltely unique ksn
    while (!unique) {
      // create new random ksn from function
      newAIDN = parseInt(nanoid() as string);
      // check if the ksn exists in the database
      logger.info('prisma.application.findUnique in generateAIDN initiated');
      const application = await this.prisma.application.findUnique({
        where: { aidn: newAIDN },
      });
      if (application === null) unique = true;
    }

    logger.info(`new aidn ${newAIDN} generated`);
    return newAIDN;
  }

  // creates a new, unique long appchain string
  async generateAppchain(): Promise<string> {
    let unique = false;
    // creates a new 'nanoid' function with default parameters
    const newAppchain: string = nanoid();
    // loop to create a completely unique appchain
    while (!unique) {
      logger.info(
        'prisma.application.findUnique in generateAppchain initiated',
      );
      const application = await this.prisma.application.findUnique({
        where: { appchain: newAppchain },
      });
      if (application === null) unique = true;
    }

    logger.info(`new appchain ${newAppchain} generated`);
    return newAppchain;
  }

  async getBasePermission(aidn: number): Promise<string> {
    let application: Application;

    try {
      logger.info(
        'prisma.application.findUnique in getBasePermission initiated',
      );
      application = await this.prisma.application.findUnique({
        where: { aidn },
      });
    } catch (error) {
      handlePrismaErrors(error);
    }

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application.basePermission;
  }

  // creates a new application
  async createApplication(dto: NewApplicationDto): Promise<IResponse> {
    let application: Application;

    // generate a new AIDN
    const aidn: number = await this.generateAIDN();

    // generate a new appchain
    const appchain: string = await this.generateAppchain();

    try {
      // create new application with prisma
      logger.info(`prisma.application.create initiated with aidn: ${aidn}`);
      application = await this.prisma.application.create({
        data: {
          callbackUrl: dto.callbackUrl,
          homepage: dto.homepage,
          description: dto.description,
          logoUrl: dto.logoUrl ?? '#',
          iconUrl: dto.iconUrl ?? '#',
          basePermission: dto.basePermission,
          appchain,
          name: dto.name,
          aidn,
        },
      });
    } catch (error) {
      // handle any errors prisma throws
      logger.error({ message: 'prisma.application.create failed', error });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Application created',
      data: { application },
    };

    logger.info({ message: 'createApplication succeeded', payload });
    return payload;
  }

  // get a list of all applications
  async getAllApplications(): Promise<IResponse> {
    let applications: Application[];

    try {
      // find all applications
      logger.info('prisma.application.findMany initiated');
      applications = await this.prisma.application.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });
    } catch (error) {
      // handle any errors prisma throws
      logger.error({ message: 'prisma.application.findMany failed', error });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Applications found',
      data: applications,
    };

    logger.info({ message: 'getAllApplications passed', payload });
    return payload;
  }

  // retrieves information for a single applicaiton by AIDN
  // this route is used by Kreative ID Admin and sends back ALL the information for an application
  async getOneApplication(
    req: IAuthenticatedRequest,
    aidn: number,
    query?: { verbose: string },
  ): Promise<IResponse> {
    let application: Application;
    let payload: IResponse;

    try {
      // gets one application from given AIDN
      logger.info(`prisma.application.findUnique initiated with aidn: ${aidn}`);
      application = await this.prisma.application.findUnique({
        where: { aidn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error(
        `prisma.application.findUnique with aidn: ${aidn} failed`,
        error,
      );
      handlePrismaErrors(error);
    }

    // checks to see if the application was found
    // if it's not it will throw a 404 error, if application is found we continue
    if (application === null || application === undefined) {
      // no application was found with the aidn that was passed
      // this behavior should not happen with actual clients as no unknown aidn should exist
      logger.warn(`no application found with aidn: ${aidn}`);
      throw new NotFoundException('Application not found');
    }

    // executes 'verbose' option in url parameter on get one application query
    if ((query !== undefined ?? true) && query.verbose === 'true') {
      // verify the appchain since only Kreative services should be able to get stats
      // verifies the appchain sent through the body
      // this method will throw errors if the appchain is not verified
      const reqAppchain = req.headers.kreative_appchain as string;
      const reqAidn: string = req.headers.kreative_aidn as string;
      const parsedAidn: number = parseInt(reqAidn);

      await verifyAppchain(parsedAidn, reqAppchain);

      // setup variables for the different statistics we need to find
      // these are all the stats that will eventually be initialized
      let totalOpenKeychains: number;
      let totalClosedKeychains: number;
      let totalTransactions: number;

      // find the total number of open keychains
      try {
        logger.info(
          `prisma.keychain.count initiated with aidn: ${aidn} and expired: false`,
        );
        totalOpenKeychains = await this.prisma.keychain.count({
          where: {
            expired: false,
            aidn,
          },
        });
      } catch (error) {
        // handle any errors prisma throws
        logger.error({
          message: `prisma.keychain.count with aidn: ${aidn} and expired: false failed`,
          error,
        });
        handlePrismaErrors(error);
      }

      // find the total number of closed keychains
      try {
        logger.info(
          `prisma.keychain.count initiated with aidn: ${aidn} and expired: true`,
        );
        totalClosedKeychains = await this.prisma.keychain.count({
          where: {
            expired: true,
            aidn,
          },
        });
      } catch (error) {
        // handle any errors prisma throws
        logger.error({
          message: `prisma.keychain.count with aidn: ${aidn} and expired: true failed`,
          error,
        });
        handlePrismaErrors(error);
      }

      // find the total number of transactions
      try {
        logger.info(`prisma.transaction.count initiated with aidn: ${aidn}`);
        totalTransactions = await this.prisma.transaction.count({
          where: {
            aidn,
          },
        });
      } catch (error) {
        // handle any errors prisma throws
        logger.error({
          message: `prisma.transaction.count with aidn: ${aidn} failed`,
          error,
        });
        handlePrismaErrors(error);
      }

      // find the total number of unique accounts
      let keychains: Keychain[];

      try {
        logger.info(
          `prisma.keychains.findMany in getOneApp initiated with aidn: ${aidn}`,
        );
        keychains = await this.prisma.keychain.findMany({
          where: {
            aidn,
          },
        });
      } catch (error) {
        // handle any errors prisma throws
        logger.error({
          message: `prisma.keychains.findMany in getOneApp with aidn: ${aidn} failed`,
          error,
        });
      }

      // create a set to store all the unique accounts
      const uniqueAccounts: number[] = [];

      // loop through all the keychains and add the account to the set
      keychains.forEach((keychain) => {
        if (!uniqueAccounts.includes(keychain.aidn)) {
          uniqueAccounts.push(keychain.aidn);
        }
      });

      // set the total unique accounts to the length of the set
      const totalUniqueAccounts: number = uniqueAccounts.length;

      // payload if there are statistics
      payload = {
        statusCode: 200,
        message: 'Application found',
        data: {
          application,
          stats: [
            {
              name: 'Total Open Keychains',
              value: totalOpenKeychains,
            },
            {
              name: 'Total Closed Keychains',
              value: totalClosedKeychains,
            },
            {
              name: 'Total Transactions',
              value: totalTransactions,
            },
            {
              name: 'Total Unique Accounts',
              value: totalUniqueAccounts,
            },
          ],
        },
      };
    } else {
      // default payload if verbose is not true
      // no statistics are added, just the application object
      payload = {
        statusCode: 200,
        message: 'Application found',
        data: { application },
      };
    }

    logger.info({
      message: `getOneApplication succeeded with aidn: ${aidn}`,
      payload,
    });
    return payload;
  }

  // get application basic for Kreative ID customer-facing
  async getOneApplicationBasic(aidn: number): Promise<IApplication> {
    let application: IApplication;

    try {
      // gets one application from given AIDN
      logger.info(`prisma.application.findUnique initiated with aidn: ${aidn}`);
      application = await this.prisma.application.findUnique({
        where: { aidn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error(
        `prisma.application.findUnique with aidn: ${aidn} failed`,
        error,
      );
      handlePrismaErrors(error);
    }

    // checks to see if the application was found
    // if it's not it will throw a 404 error, if application is found we continue
    if (application === null || application === undefined) {
      // no application was found with the aidn that was passed
      // this behavior should not happen with actual clients as no unknown aidn should exist
      logger.warn(`no application found with aidn: ${aidn}`);
      throw new NotFoundException('Application not found');
    }

    // removes sensitive data from application
    delete application.appchain;

    logger.info({
      message: `getOneApplicationBasic succeeded with aidn: ${aidn}`,
      application,
    });
    return application;
  }

  // updates one application by AIDN
  async updateApplication(
    aidn: number,
    dto: UpdateApplicationDto,
  ): Promise<IResponse> {
    let applicationChange: any;
    let newAppchain: string;

    if (dto.refreshAppchain) {
      logger.info(`refreshing appchain for aidn: ${aidn}`);
      newAppchain = await this.generateAppchain();
    }

    try {
      if (dto.refreshAppchain) {
        // updates the application with a new appchain
        logger.info(
          `prisma.application.update initiated with aidn: ${aidn}, with new appchain`,
        );
        applicationChange = await this.prisma.application.update({
          where: { aidn },
          data: {
            basePermission: dto.basePermission,
            name: dto.name,
            callbackUrl: dto.callbackUrl,
            homepage: dto.homepage,
            description: dto.description,
            logoUrl: dto.logoUrl,
            iconUrl: dto.iconUrl,
            appchain: newAppchain,
          },
        });
      } else {
        // updates the application without a new appchain
        logger.info(
          `prisma.application.update initiated with aidn: ${aidn}, no new appchain`,
        );
        applicationChange = await this.prisma.application.update({
          where: { aidn },
          data: {
            basePermission: dto.basePermission,
            name: dto.name,
            callbackUrl: dto.callbackUrl,
            homepage: dto.homepage,
            description: dto.description,
            logoUrl: dto.logoUrl,
            iconUrl: dto.iconUrl,
          },
        });
      }
    } catch (error) {
      // handle any prisma errors
      logger.error({
        message: `prisma.error.update with aidn: ${aidn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Application updated',
      data: { applicationChange },
    };

    logger.info({
      message: `updateApplication succeeded with aidn: ${aidn}`,
      payload,
    });
    return payload;
  }

  // deletes an application from given AIDN
  async deleteApplication(aidn: number): Promise<IResponse> {
    let deleteApplication: any;

    try {
      // deletes application with prisma
      logger.info(`prisma.application.delete initiated with aidn: ${aidn}`);
      deleteApplication = await this.prisma.application.delete({
        where: { aidn },
      });
    } catch (error) {
      // handles any prisma errors
      logger.error({
        message: `prisma.application.delete with aidn: ${aidn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Application deleted',
      data: { deleteApplication },
    };

    logger.info({
      message: `deleteApplication succeeded with aidn: ${aidn}`,
      payload,
    });
    return payload;
  }

  async verifyAppchain(
    aidn: number,
    dto: VerifyAppchainDto,
  ): Promise<IResponse> {
    let application: Application;

    try {
      // gets one application from given aidn
      logger.info(
        `prisma.application.findUnique initiated with appchain: ${aidn}`,
      );
      application = await this.prisma.application.findUnique({
        where: { aidn },
      });
    } catch (error) {
      // handle any prisma errors that come up
      logger.error({
        message: `prisma.application.findUnique in verifyAppchain with aidn: ${aidn} failed`,
        error,
      });
      handlePrismaErrors(error);
    }

    if (application === null || application === undefined) {
      // no application was found with the aidn that was passed
      // this behavior should not happen with actual clients as no unknown aidn should exist
      logger.warn(`no application found with aidn: ${aidn}`);
      throw new NotFoundException('Application not found in verifyAppchain');
    }

    if (application.appchain !== dto.appchain) {
      throw new ForbiddenException('Appchain mismatch');
    }

    // removes sensitive data from application
    delete application.appchain;

    const payload: IResponse = {
      statusCode: 200,
      message: 'Appchain verified',
      data: { application },
    };

    logger.info({
      message: `verifyAppchain succeeded with aidn: ${aidn}`,
      payload,
    });
    return payload;
  }
}
