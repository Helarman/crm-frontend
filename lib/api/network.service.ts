import axios from 'axios';
import { Restaurant } from './dictionaries.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface Network {
  id: string;
  name: string;
 restaurants?: Restaurant[];
  description?: string;
  ownerId: string;
  owner: any
  tenantId?: string;
  logo?: string;
  primaryColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkWithRestaurants extends Network {
  restaurants?: Restaurant[];
}

export interface CreateNetworkDto {
  name: string;
  description?: string;
  ownerId: string;
  tenantId?: string | null;
  logo?: string;
  primaryColor?: string;
}

export interface UpdateNetworkDto extends Partial<CreateNetworkDto> {}

export const NetworkService = {
  async getAll(): Promise<Network[]> {
    const { data } = await api.get('/networks');

    return data;
  },

  async getByUser(userId: string): Promise<Network> {
    const { data } = await api.get(`/networks/user/${userId}`);
    return data;
  },

  async getById(id: string): Promise<Network> {
    const { data } = await api.get(`/networks/${id}`);
    return data;
  },

  async create(dto: CreateNetworkDto): Promise<Network> {
    const { data } = await api.post('/networks', dto);
    return data;
  },

  async update(id: string, dto: UpdateNetworkDto): Promise<Network> {
    console.log(dto)
    const { data } = await api.put(`/networks/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/networks/${id}`);
  },

  async getRestaurants(networkId: string): Promise<Restaurant[]> {
    const { data } = await api.get(
      `/networks/${networkId}/restaurants`
    );
    return data;
  },

  async addUser(networkId: string, userId: string): Promise<void> {
    await api.post(`/networks/${networkId}/users`, { userId });
  },

  async removeUser(networkId: string, userId: string): Promise<void> {
    await api.delete(`/networks/${networkId}/users/${userId}`);
  },
};