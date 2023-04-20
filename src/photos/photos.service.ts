import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Photo } from '@prisma/client';
import { S3 } from 'aws-sdk';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse } from '../../types/IResponse';
import { handlePrismaErrors } from '../../utils/handlePrismaErrors';
import { IAuthenticatedRequest } from 'types/IAuthenticatedRequest';
import logger from '../../utils/logger';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  async uploadPhotoFromFile(
    ksn: number,
    photo: Express.Multer.File,
    category: string,
  ): Promise<Photo> {
    let uploadResult: S3.ManagedUpload.SendData;
    let uploadedPhoto: Photo;
    let optimizedImage: Buffer;

    logger.debug({
      message: `photos.uploadPhotoFromFile initiated for ${ksn}`,
      photo,
      category,
    });

    // optimize the image using sharp based on photo type
    if (category === 'avatar') {
      optimizedImage = await sharp(photo.buffer)
        .resize({ width: 300, height: 300, fit: 'cover' })
        .toBuffer();
    } else {
      optimizedImage = await sharp(photo.buffer)
        .resize({ width: 800 })
        .toBuffer();
    }

    try {
      uploadResult = await s3
        .upload({
          Bucket: 'cdn.kreativeusa.com',
          Key: `kreative_id/${category}/${Date.now()}_${ksn}_${
            photo.originalname
          }`,
          Body: optimizedImage,
        })
        .promise();
    } catch (error) {
      logger.error({
        message: `s3.upload failed for ${ksn} in upload photos api: ${error.message}`,
        error,
      });
      throw new InternalServerErrorException('Photo upload failed');
    }

    logger.info({ message: `s3.upload succeeded for ${ksn}`, uploadResult });

    try {
      logger.info(`prisma.photo.create initiated for ${ksn}`);
      uploadedPhoto = await this.prisma.photo.create({
        data: {
          url: `https://cdn.kreativeusa.com/${uploadResult.Key}`,
          filename: photo.originalname,
          category,
          ksn,
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.photo.create failed for ${ksn} in upload photos api: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info({
      message: `prisma.photo.create succeeded for ${ksn}`,
      uploadedPhoto,
    });
    return uploadedPhoto;
  }

  async uploadPhotoFromUrl(
    ksn: number,
    url: string,
    category: string,
    filename: string,
  ): Promise<Photo> {
    let uploadedPhoto: Photo;

    logger.debug({
      message: `photos.uploadPhotoFromUrl initiated for ${ksn}`,
      url,
      category,
      filename,
    });

    try {
      logger.info(`prisma.photo.create initiated for ${ksn}`);
      uploadedPhoto = await this.prisma.photo.create({
        data: {
          url,
          filename,
          category,
          ksn,
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.photo.create failed for ${ksn} in upload photos api: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    logger.info({
      message: `prisma.photo.create succeeded for ${ksn}`,
      uploadedPhoto,
    });
    return uploadedPhoto;
  }

  async uploadPhotoForAPI(
    req: IAuthenticatedRequest,
    photo: Express.Multer.File,
    category: string,
  ): Promise<IResponse> {
    const ksn = req.kreativeAccount.ksn;
    const uploadedPhoto = await this.uploadPhotoFromFile(ksn, photo, category);

    return {
      statusCode: 201,
      message: 'Photo uploaded successfully',
      data: {
        filename: uploadedPhoto.filename,
        url: uploadedPhoto.url,
      },
    };
  }

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

  // this will find all the photos for a given user based on the KSN that is passed in
  // from the authentication token, that is found in the authentiacteUser middleware
  async findAllForUser(
    req: IAuthenticatedRequest,
    category: string,
  ): Promise<IResponse> {
    const ksn: number = parseInt(req.kreativeAccount.ksn as string);
    const _category: string = category !== 'all' ? category : undefined;
    let photos: Photo[];

    try {
      logger.info(`prisma.photo.findMany initiated for ${ksn}`);
      photos = await this.prisma.photo.findMany({
        where: {
          category: _category,
          ksn,
        },
      });
    } catch (error) {
      logger.error({
        message: `prisma.photo.findMany failed for ${ksn} & ${category}: ${error.message}`,
        error,
      });
      handlePrismaErrors(error);
    }

    const payload: IResponse = {
      statusCode: 200,
      message: 'Found all photos for user',
      data: { photos },
    };

    logger.info({
      message: 'photos.service.findAllForUser succeeded',
      payload,
    });
    return payload;
  }
}
