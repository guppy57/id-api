import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserAuthGuard } from '../../guards/userAuth.guard';
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
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN', 'KREATIVE_ID_DEVELOPER']))
  async findAllAsAdmin(): Promise<IResponse> {
    logger.info('GET /photos/admin initiated');
    return this.photosService.findAll();
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async findAllAsUser(
    @Req() req: IAuthenticatedRequest,
    @Query('category') category: string,
  ): Promise<IResponse> {
    logger.info('GET /photos/user initiated');
    return this.photosService.findAllForUser(req, category);
  }

  @Post(':category')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo'))
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  async uploadPhoto(
    @Req() req: IAuthenticatedRequest,
    @UploadedFile() photo: Express.Multer.File,
    @Param('category') category: string,
  ): Promise<IResponse> {
    logger.info(`POST /photos/${category} initiated`);

    // these are all the potential categories that a photo can be uploaded to
    // if we need to add more categories, we need to manually change the code here.
    // eventually we can have an API to manage photo categories, but for now this is fine
    const ACCEPTED_CATEGORIES = ['avatar', 'misc'];

    // if the category is not in the list of accepted categories, throw an error
    if (!ACCEPTED_CATEGORIES.includes(category)) {
      logger.warn(`Invalid category used for photos api: ${category}`);
      throw new BadRequestException(
        `Invalid category: ${category} is not a valid category`,
      );
    }

    return this.photosService.uploadPhoto(req, photo, category);
  }
}
