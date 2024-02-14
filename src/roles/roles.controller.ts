import { Controller, UseGuards, Post, Delete, Body, Req } from '@nestjs/common';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import { AppAuthGaurd } from '../../guards/appAuth.guard';
import { RolesOnAccounts } from '@prisma/client';
import { RolesService } from './roles.service';
import { IResponse } from '../../types/IResponse';
import { IAuthenticatedRequest } from '../../types/IAuthenticatedRequest';
import logger from '../../utils/logger';

// for the sake of time, we are forgoing back office routes
// this controller is designed for application use and not to create an admin db for Kreative
// we will use other tools instead for that purpose.

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  // remove a role from a user
  @Delete('')
  @UseGuards(new AppAuthGaurd())
  async removeRole(
    @Body('role') role: string[],
    @Body('ksn') ksn: number,
  ): Promise<IResponse> {
    logger.info('POST /roles/remove initiated');
    return this.rolesService.removeRoleForUser(ksn, role);
  }

  // attach roles to a user
  @Post('')
  @UseGuards(new AppAuthGaurd())
  async addRole(
    @Body('roles') roles: string[],
    @Body('ksn') ksn: number,
  ): Promise<IResponse> {
    logger.info('POST /roles/add initiated');
    return this.rolesService.addRolesForUser(ksn, roles);
  }

  @Post('replace')
  @UseGuards(new AppAuthGaurd())
  async replaceRoles(
    @Body('new_roles') newRoles: string[],
    @Body('old_roles') oldRoles: string[],
    @Body('ksn') ksn: number,
  ): Promise<IResponse> {
    logger.info('POST /roles/replace initiated');
    return this.rolesService.replaceRolesForUser(ksn, newRoles, oldRoles);
  }

  // verify that a user has a specific role
  @Post('verify')
  @UseGuards(new AppAuthGaurd())
  async verifyRoleForUser(
    @Body('ksn') ksn: number,
    @Body('roles') roles: string[],
  ): Promise<IResponse> {
    logger.info('POST /roles/verify initiated');
    return this.rolesService.verifyRolesForUser(ksn, roles);
  }
}
