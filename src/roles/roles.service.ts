import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import logger from '../../utils/logger';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { RolesOnAccounts } from '@prisma/client';
import compareRoles from '../../utils/compareRoles';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) { }

  async removeRoleForUser(ksn: number, roles: string[]): Promise<IResponse> {
    logger.info('rolesService.removeRoleForUser initiated', {
      ksn,
      roles,
    });
    let responseData: any = {};

    try {
      responseData = await this.prisma.rolesOnAccounts.deleteMany({
        where: {
          ksn,
          rid: {
            in: roles,
          },
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.rolesOnAccounts.deleteMany failed for ${ksn} & ${roles}: ${error.message}`,
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

  async addRolesForUser(ksn: number, roles: string[]): Promise<IResponse> {
    logger.info('rolesService.addRolesForUser initiated', {
      ksn,
      roles,
    });

    let existingRoles: RolesOnAccounts[];

    try {
      logger.info(`prisma.rolesOnAccounts.findMany initiated for ${ksn}`);
      existingRoles = await this.prisma.rolesOnAccounts.findMany({
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

    const cleanedRoles: string[] = [];
    const rolesOnAccountIds: string[] = existingRoles.map((role) => role.rid);

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

  async addRolesForManyUsers(
    ksnList: number[],
    role: string,
  ): Promise<IResponse> {
    logger.info('rolesService.addRolesForManyUsers initiated', {
      ksnList,
      role,
    });

    const rolesToAdd = ksnList.map((ksn) => {
      return {
        ksn,
        rid: role,
      };
    });

    let responseData: any;

    try {
      responseData = await this.prisma.rolesOnAccounts.createMany({
        data: rolesToAdd,
      });
    } catch (error) {
      logger.error({
        message: `prisma.rolesOnAccounts.create failed for ${role}: ${error.message}`,
        ksnList,
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info({
      message: 'rolesService.addRolesForManyUsers succeeded',
      responseData,
    });

    return {
      statusCode: 200,
      message: 'Added roles for many users',
      data: responseData,
    } as IResponse;
  }

  async replaceRolesForUser(
    ksn: number,
    newRoles: string[],
    oldRoles: string[],
  ): Promise<IResponse> {
    logger.info('rolesService.replaceRolesForUser initiated', {
      ksn,
      newRoles,
      oldRoles,
    });

    const removeResponse: IResponse = await this.removeRoleForUser(
      ksn,
      oldRoles,
    );
    const addResponse: IResponse = await this.addRolesForUser(ksn, newRoles);

    logger.info({
      message: 'rolesService.replaceRolesForUser succeeded',
      removeResponse,
      addResponse,
    });

    return {
      statusCode: 200,
      message: 'Replaced roles for user',
      data: {
        removed: removeResponse.data,
        added: addResponse.data,
      },
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
