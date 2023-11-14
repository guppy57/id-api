import { Request, Headers } from '@nestjs/common';

export interface IAuthenticatedRequest extends Request {
  // attachs the whole 'account' object to the request
  kreativeAccount: any;
  headers: Headers & {
    kreative_id_key?: string;
    kreative_aidn?: string;
  };
}