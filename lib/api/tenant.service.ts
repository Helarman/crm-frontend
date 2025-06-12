import axios from 'axios';
import { Network } from './network.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  networkId?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}

export const TenantService = {
  async getAll(): Promise<Tenant[]> {
    const { data } = await api.get('/tenants');
    return data;
  },

  async getById(id: string): Promise<Tenant> {
    const { data } = await api.get(`/tenants/${id}`);
    return data;
  },

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const { data } = await api.post('/tenants', dto);
    return data;
  },

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const { data } = await api.put(`/tenants/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tenants/${id}`);
  },

  async getNetworks(tenantId: string): Promise<Network[]> {
    const { data } = await api.get(
      `/tenants/${tenantId}/networks`
    );
    return data;
  },
};