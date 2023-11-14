import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime';
import logger from './logger';

// handles different prisma errors and sends a response
export function handlePrismaErrors(error: any, message?: string): void {
  // handles errors of PrismaClientKnownRequestError
  if (error.code === 'P2002') {
    // retrieve the field that isn't meeting unique constraint error
    const target: string = error.meta.target[0];
    logger.warn({ message: 'prismaError: unique constraint failed', error });
    throw new ForbiddenException(`unique constraint failed for ${target}`);
  } else if (error.code === 'P2003') {
    // foreign key constraint fails
    logger.error({
      message: 'prismaError: failed foreign key constraint',
      error,
    });
    throw new BadRequestException('failed foreign key constraint');
  } else if (error.code === 'P2025') {
    // there was nothing found with a given unique key
    logger.warn('prismaError: unique key found nothing', { error });
    throw new NotFoundException(message);
  }

  // handles errors of PrismaClientUnknownRequestError
  // and handles errors of if the underlying engine/system crashes
  if (
    error instanceof
    (PrismaClientUnknownRequestError || PrismaClientRustPanicError)
  ) {
    console.log(error);
    logger.error({ message: 'prismaError: unknown error', error });
    throw new InternalServerErrorException();
  }

  // handles errors of the database and query engine initializing
  if (error instanceof PrismaClientInitializationError) {
    console.log(error);
    logger.error({ message: 'prismaError: unknown error', error });
    throw new InternalServerErrorException();
  }

  // handles errors of PrismaClientValidationError
  if (error instanceof PrismaClientValidationError) {
    console.log(error);
    logger.error({ message: 'prismaError: unknown bad request error', error });
    throw new BadRequestException();
  }

  // catch all method to handle any other errors
  throw new InternalServerErrorException('Something went wrong');
}
