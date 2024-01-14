export interface IApplication {
  aidn: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  callbackUrl: string;
  homepage: string;
  description: string;
  logoUrl: string;
  iconUrl: string;
  basePermission?: string;
}
