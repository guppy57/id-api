import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PhotosService } from './photos.service';
import { IResponse } from '../../types/IResponse';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import logger from '../../utils/logger';
import { FileInterceptor } from '@nestjs/platform-express';

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
  async findAllAsUser(
    @Req() req: IAuthenticatedRequest,
    @Query('category') category: string,
  ): Promise<IResponse> {
    logger.info('GET /photos/user initiated');
    return this.photosService.findAllForUser(req, category);
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Req() req: IAuthenticatedRequest,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<IResponse> {
    logger.info('POST /photos initiated');
    return this.photosService.uploadPhoto(req, photo);
  }
}
