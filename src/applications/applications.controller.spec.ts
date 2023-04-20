import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { IResponse } from 'types/IResponse';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsController } from './applications.controller';
import { NewApplicationDto } from './applications.dto';
import { ApplicationsService } from './applications.service';

const API_ENDPOINT = '/api/v1/applications';

describe('Applications Controller', () => {
  let controller: ApplicationsController;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [ApplicationsService, PrismaService],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // it('should create application', async () => {
  //   const payload = {
  //     name: 'Kreative',
  //     callbackUrl: 'https://kreative.id/auth',
  //     homepage: 'https://kreative.id',
  //     description: 'Kreative ID Test',
  //   } as NewApplicationDto;
  //
  //   const response: IResponse = await controller.createApplication(payload);
  //
  //   expect(response).toMatchObject({
  //     statusCode: 200,
  //     message: 'Application created',
  //     data: expect.any(Object),
  //   } satisfies IResponse);
  // });
  //
  // // TODO fix this stupid test, it should work
  // // it('should get all applications', async () => {
  // //   return request(app.getHttpServer())
  // //     .get(API_ENDPOINT)
  // //     .expect({
  // //       statusCode: 200,
  // //       message: "Applications found",
  // //       data: expect.any(Array)
  // //     });
  // // });
  //
  // it('should fail from invalid schema', async () => {
  //   const payload = { fname: 'Kreative' } as unknown as NewApplicationDto;
  //
  //   try {
  //     await controller.createApplication(payload);
  //   } catch (error) {
  //     console.log(error);
  //     expect(error.response).toMatchObject({
  //       statusCode: 400,
  //       message: 'Bad Request',
  //     });
  //   }
  // });
  //
  // it('should fail from invaid method', () => {
  //   return request(app.getHttpServer()).put(API_ENDPOINT).expect({
  //     statusCode: 404,
  //     message: 'Cannot PUT /api/v1/applications',
  //     error: 'Not Found',
  //   });
  // });
});
