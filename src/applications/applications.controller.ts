import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { IResponse } from 'types/IResponse';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import { IApplication } from 'types/IApplication';
import { NewApplicationDto, UpdateApplicationDto } from './applications.dto';
import { ApplicationsService } from './applications.service';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import logger from '../../utils/logger';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async createApplication(@Body() dto: NewApplicationDto): Promise<IResponse> {
    logger.info({ message: 'POST /applications initiated', body: dto });
    return this.applicationsService.createApplication(dto);
  }

  @Get('')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async getAllApplications(): Promise<IResponse> {
    logger.info('GET /applications initiated');
    return this.applicationsService.getAllApplications();
  }

  @Get(':aidn')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async getApplication(
    @Req() req: IAuthenticatedRequest,
    @Param('aidn', ParseIntPipe) aidn: number,
    @Query() query?: { verbose: string },
  ): Promise<IResponse> {
    logger.info(`GET /applications/${aidn} initiated`);
    return this.applicationsService.getOneApplication(req, aidn, query);
  }

  @Get(':aidn/basic')
  async getApplicationBasic(
    @Req() req: Request,
    @Param('aidn', ParseIntPipe) aidn: number,
  ): Promise<IResponse> {
    logger.info(`GET /applications/${aidn}/basic initiated`);

    let response: IResponse = {
      statusCode: 202,
      message: 'Application data retrieved (basic)',
    };

    try {
      logger.info('this.applicationsService.getOneApplicationBasic() called');
      const basicAppData: IApplication =
        await this.applicationsService.getOneApplicationBasic(aidn);
      response['data'] = basicAppData;
      logger.info({
        message: 'this.applicationsService.getOneApplicationBasic() succeeded',
        data: basicAppData,
      });
    } catch (error) {
      logger.error({
        message: 'this.applicationsService.getOneApplicationBasic() failed',
        error,
      });
      response = {
        statusCode: 500,
        message: error.message,
        error,
      };
    }

    return response;
  }

  @Post(':aidn')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async updateApplication(
    @Param('aidn', ParseIntPipe) aidn: number,
    @Body() dto: UpdateApplicationDto,
  ): Promise<IResponse> {
    logger.info({ message: `POST /applications/${aidn} initiated`, body: dto });
    return this.applicationsService.updateApplication(aidn, dto);
  }

  @Delete(':aidn')
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async deleteApplication(
    @Param('aidn', ParseIntPipe) aidn: number,
  ): Promise<IResponse> {
    logger.info(`DELETE /applications/${aidn} initiated`);
    return this.applicationsService.deleteApplication(aidn);
  }
}
