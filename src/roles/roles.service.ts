import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import logger from '../../utils/logger';
import { handlePrismaErrors } from 'utils/handlePrismaErrors';
import { RolesOnAccounts } from '@prisma/client';
import compareRoles from '../../utils/compareRoles';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async updateRolesForUser(
    ksn: number,
    role: string,
    action: string,
    aidn: number,
  ): Promise<IResponse> {
    logger.info('rolesService.updateRolesForUser initiated', {
      ksn,
      role,
      action,
      aidn,
    });
    let responseData: any = {};

    if (action === 'remove') {
      logger.info(`removing role ${role} from user ${ksn}`);
      try {
        responseData = await this.prisma.rolesOnAccounts.deleteMany({
          where: {
            ksn,
            rid: role,
          },
        });
      } catch (error) {
        logger.error({
          message: `prisma.rolesOnAccounts.deleteMany failed for ${ksn} & ${role}: ${error.message}`,
          error,
        });
        handlePrismaErrors(error);
      }
    } else if (action === 'add') {
      logger.info(`adding role ${role} to user ${ksn}`);
      try {
        responseData = await this.prisma.rolesOnAccounts.create({
          data: {
            rid: role,
            ksn,
          },
        });
      } catch (error) {
        logger.error({
          message: `prisma.rolesOnAccounts.create failed for ${ksn} & ${role}: ${error.message}`,
          error,
        });
        handlePrismaErrors(error);
      }
    } else {
      logger.error('rolesService.updateRolesForUser: invalid action');
      throw new BadRequestException('Invalid action');
    }

    logger.info({
      message: 'rolesService.updateRolesForUser succeeded',
      responseData,
    });
    return {
      statusCode: 200,
      message: 'Updated roles for user',
      data: responseData,
    } as IResponse;
  }

  async verifyRolesForUser(ksn: number, roles: string[]): Promise<IResponse> {
    logger.info(`verifying role ${roles} for user ${ksn}`);
    let rolesOnAccount: RolesOnAccounts[];

    try {
      logger.info(`prisma.rolesOnAccounts.findMany initiated for ${ksn}`);
      rolesOnAccount = await this.prisma.rolesOnAccounts.findMany({
        where: {
          ksn,
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.rolesOnAccounts.findMany failed for ${ksn} & ${roles}: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    const hasRoles: boolean = await compareRoles(rolesOnAccount, roles);

    logger.info({
      message: 'rolesService.verifyRoleForUser succeeded',
      rolesOnAccount,
    });
    return {
      statusCode: 200,
      message: 'Verified role for user',
      data: {
        hasRoles,
      },
    } as IResponse;
  }
}
