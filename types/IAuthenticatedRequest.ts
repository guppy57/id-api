import { Request } from '@nestjs/common';

export interface IAuthenticatedRequest extends Request {
  // attachs the whole 'account' object to the request
  kreativeAccount: any;
};