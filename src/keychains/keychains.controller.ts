import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VerifyKeychainDto, CloseKeychainDto } from './keychains.dto';
import { KeychainsService } from './keychains.service';
import { UserAuthGuard } from '../../guards/userAuth.guard';
import logger from '../../utils/logger';

@Controller('keychains')
export class KeychainsController {
  constructor(private readonly keychainService: KeychainsService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_ADMIN']))
  getAllKeychains() {
    logger.info('GET /keychains initiated');
    return this.keychainService.getAllKeychains();
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(new UserAuthGuard(['KREATIVE_ID_USER']))
  closeKeychain(@Body() key: string) {
    logger.info('POST /keychains/close initiated');
    return this.keychainService.closeKeychain(key);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verifyKeychain(@Body() dto: VerifyKeychainDto) {
    logger.info({ message: 'POST /keychains/verify initiated', body: dto });
    return this.keychainService.verifyKeychain(dto);
  }
}
