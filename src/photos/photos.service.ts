import { Injectable } from '@nestjs/common';
import { Photo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import logger from '../../utils/logger';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  // TODO add pagination for this route as there will be a crap ton of photos
  async findAll(): Promise<IResponse> {
    let photos: Photo[];

    try {
      logger.info('prisma.photo.findMany initiated');
      photos = await this.prisma.photo.findMany();
    } catch (error) {
      logger.error({
        message: `prisma.photo.findMany failed: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Found all photos',
      data: { photos },
    };

    logger.info({ message: 'photos.service.findAll succeeded', payload });
    return payload;
  }

  async findAllForUser(req: IAuthenticatedRequest): Promise<IResponse> {}

  async uploadPhoto(req: IAuthenticatedRequest): Promise<IResponse> {}
}
