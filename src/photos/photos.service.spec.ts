import { Test, TestingModule } from '@nestjs/testing';
import { PhotosService } from './photos.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('PhotosService', () => {
  let service: PhotosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhotosService],
      imports: [PrismaModule],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
