import { Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { IResponse } from '../../types/IResponse';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import logger from '../../utils/logger';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  async findAllAsAdmin(): Promise<IResponse> {
    logger.info('GET /photos/admin initiated');
    return this.photosService.findAll();
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  async findAllAsUser(@Req() req: IAuthenticatedRequest): Promise<IResponse> {
    logger.info('GET /photos/user initiated');
    return this.photosService.findAllForUser(req);
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async uploadPhoto(@Req() req: IAuthenticatedRequest): Promise<IResponse> {
    logger.info('POST /photos initiated');
    return this.photosService.uploadPhoto(req);
  }
}
