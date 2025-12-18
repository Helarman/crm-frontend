export interface CustomerDto {
  id: string;
  phone: string;
  networkId: string;
  createdAt?: Date;
  bonusPoints?: number;
  personalDiscount?: number;
  shortCode?: string;
  shortCodeExpires?: Date;
  lastLogin?: Date;
}

export interface VerifyCodeResponseDto {
  accessToken: string;
  refreshToken: string;
  customer: CustomerDto;
}

export interface ShortCodeResponseDto {
  shortCode: string;
  shortCodeExpires: Date;
}

export interface BonusBalance {
  networkId: string;
  networkName?: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface PersonalDiscount {
  id: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    title: string;
    network?: {
      id: string;
      name: string;
    };
  };
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BonusTransaction {
  id: string;
  customerId: string;
  networkId: string;
  amount: number;
  type: 'EARN' | 'SPEND' | 'ADJUST' | 'EXPIRY';
  orderId?: string;
  description?: string;
  balanceAfter?: number;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedCustomersResponse extends PaginatedResponse<CustomerDto> {}
export interface PaginatedTransactionsResponse extends PaginatedResponse<BonusTransaction> {}

export interface RequestCodeDto {
  phone: string;
  networkId: string;
}

export interface VerifyCodeDto {
  phone: string;
  code: string;
  networkId: string;
}