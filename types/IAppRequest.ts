export interface IAppRequest extends Request {
  headers: Headers & {
    kreative_id_appchain?: string;
  };
}
