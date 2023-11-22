import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import logger from '../../utils/logger';
import { handlePrismaErrors } from 'utils/handlePrismaErrors';
import { RolesOnAccounts } from '@prisma/client';
import compareRoles from '../../utils/compareRoles';
import { CONTAINS } from 'class-validator';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async removeRoleForUser(ksn: number, role: string): Promise<IResponse> {
    logger.info('rolesService.removeRoleForUser initiated', {
      ksn,
      role,
    });
    let responseData: any = {};

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

    logger.info({
      message: 'rolesService.removeRoleForUser succeeded',
      responseData,
    });
    return {
      statusCode: 200,
      message: 'Removed role for user',
      data: responseData,
    } as IResponse;
  }

  async addRolesForUser(
    ksn: number,
    roles: string[],
    existingRoles: RolesOnAccounts[],
  ): Promise<IResponse> {
    logger.info('rolesService.addRolesForUser initiated', {
      ksn,
      roles,
    });

    console.log(roles);
    console.log(existingRoles);

    const cleanedRoles: string[] = [];
    const rolesOnAccountIds: string[] = existingRoles.map((role) => role.rid);

    console.log(rolesOnAccountIds);

    for (let i = 0; i < roles.length; i++) {
      if (!rolesOnAccountIds.includes(roles[i])) {
        console.log(`${roles[i]} not in ${rolesOnAccountIds}`);
        cleanedRoles.push(roles[i]);
      }
    }

    let responseData: any;
    const rolesToAdd: { ksn: number; rid: string }[] = [];

    for (let i = 0; i < cleanedRoles.length; i++) {
      rolesToAdd.push({
        ksn,
        rid: cleanedRoles[i],
      });
    }

    try {
      responseData = await this.prisma.rolesOnAccounts.createMany({
        data: rolesToAdd,
      });
    } catch (error) {
      logger.error({
        message: `prisma.rolesOnAccounts.create failed for ${ksn} & ${roles}: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info({
      message: 'rolesService.addRolesForUser succeeded',
      responseData,
    });
    return {
      statusCode: 200,
      message: 'Added roles for user',
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
