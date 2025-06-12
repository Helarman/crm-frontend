import useSWR from 'swr';
import { useNetwork, useNetworkActions, useNetworkRestaurants } from './useNetworks';
import { TenantService } from '../api/tenant.service';


export interface Tenant {
  id: string;
  name: string;
  type: 'API' | 'MARKETPLACE' | 'ECOMMERCE' | 'POS';
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

export interface TenantResponse {
  data: Tenant;
}

export interface TenantListResponse {
  data: Tenant[];
}

export const useTenants = () => {
  return useSWR<TenantListResponse>(
    'tenants', 
    () => TenantService.getAll(),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useTenants:', err)
    }
  );
};

export const useTenant = (id: string) => {
  return useSWR<TenantResponse>(
    id ? `tenant-${id}` : null,
    () => TenantService.getById(id),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useTenant:', err)
    }
  );
};

export const useTenantNetworks = (tenantId: string) => {
  return useSWR(
    tenantId ? `tenant-networks-${tenantId}` : null,
    () => {
      if (!tenantId) return null;
      return TenantService.getNetworks(tenantId);
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: (err) => console.error('Error in useTenantNetworks:', err)
    }
  );
};

export const useTenantActions = () => {
  return {
    createTenant: TenantService.create,
    updateTenant: TenantService.update,
    deleteTenant: TenantService.delete,
    assignNetworkToTenant: TenantService.assignNetwork,
    removeNetworkFromTenant: TenantService.removeNetwork
  };
};

// Комбинированные хуки
export const useNetworkManagement = (networkId?: string) => {
  const { data: network, error, isLoading } = useNetwork(networkId || '');
  const { data: restaurants } = useNetworkRestaurants(networkId || '');
  const actions = useNetworkActions();

  return {
    network,
    restaurants,
    isLoading,
    error,
    ...actions
  };
};

export const useTenantManagement = (tenantId?: string) => {
  const { data: tenant, error, isLoading } = useTenant(tenantId || '');
  const { data: networks } = useTenantNetworks(tenantId || '');
  const actions = useTenantActions();

  return {
    tenant,
    networks,
    isLoading,
    error,
    ...actions
  };
};
