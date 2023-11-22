import { Request, Headers } from '@nestjs/common';

export interface IAuthenticatedRequest extends Request {
  // attachs the whole 'account' object to the request
  kreativeAccount: any;
  // AIDN of the application that made the call to Kreative ID API
  requestingAIDN: number;
  headers: Headers & {
    kreative_id_key?: string;
    kreative_aidn?: string;
    kreative_appchain?: string;
  };
}
