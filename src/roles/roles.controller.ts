import { Controller, UseGuards, Post, Body, Req } from '@nestjs/common';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import { RolesService } from './roles.service';
import { IResponse } from '../../types/IResponse';
import { IAuthenticatedRequest } from '../../types/IAuthenticatedRequest';
import logger from '../../utils/logger';

// for the sake of time, we are forgoing back office routes
// this controller is designed for application use and not to create an admin db for Kreative
// we will use other tools instead for that purpose.

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // remove a role from a user
  @Post('remove')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async removeRole(
    @Req() req: IAuthenticatedRequest,
    @Body('role') role: string,
  ): Promise<IResponse> {
    logger.info('POST /roles/remove initiated');
    const ksn = req.kreativeAccount.ksn;
    return this.rolesService.removeRoleForUser(ksn, role);
  }

  // attach roles to a user
  @Post('add')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async addRole(
    @Req() req: IAuthenticatedRequest,
    @Body('roles') roles: string[],
  ): Promise<IResponse> {
    logger.info('POST /roles/add initiated');
    const ksn = req.kreativeAccount.ksn;
    const existingRoles = req.kreativeAccount.roles;
    return this.rolesService.addRolesForUser(ksn, roles, existingRoles);
  }

  // verify that a user has a specific role
  @Post('verify')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async verifyRoleForUser(
    @Req() req: IAuthenticatedRequest,
    @Body('roles') roles: string[],
  ): Promise<IResponse> {
    logger.info('POST /roles/verify initiated');
    const ksn = req.kreativeAccount.ksn;
    return this.rolesService.verifyRolesForUser(ksn, roles);
  }
}
