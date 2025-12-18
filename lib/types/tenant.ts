export enum TenantType {
  API = 'API',
  ECOMMERCE = 'ECOMMERCE',
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  domain?: string;
  subdomain?: string;
  isActive: boolean;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  type: TenantType;
  domain?: string;
  subdomain?: string;
  isActive?: boolean;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}

export interface TenantColorSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}