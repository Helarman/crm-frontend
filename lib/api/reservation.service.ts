import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ========== DTO ИНТЕРФЕЙСЫ ==========

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ARRIVED = 'ARRIVED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED',
}

export enum ReservationSource {
  PANEL = 'PANEL',
  WEBSITE = 'WEBSITE',
  MOBILE_APP = 'MOBILE_APP',
  YANDEX_FOOD = 'YANDEX_FOOD',
}

export interface ReservationDto {
  id: string;
  tableId: string;
  table?: {
    id: string;
    name: string;
    seats: number;
    hall?: {
      id: string;
      title: string;
      restaurantId: string;
    };
  };
  phone: string;
  customerName: string;
  email?: string;
  reservationTime: Date;
  numberOfPeople: number;
  comment?: string;
  status: ReservationStatus;
  source: ReservationSource;
  arrivalTime?: Date;
  cancellationTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReservationDto {
  tableId: string;
  phone: string;
  customerName: string;
  reservationTime: string; // ISO string
  numberOfPeople: number;
  comment?: string;
  source?: ReservationSource;
  email?: string;
}

export interface UpdateReservationDto {
  reservationTime?: string; // ISO string
  numberOfPeople?: number;
  comment?: string;
  status?: ReservationStatus;
  arrivalTime?: string; // ISO string
  cancellationTime?: string; // ISO string
}

export interface ReservationQueryDto {
  restaurantId?: string;
  hallId?: string;
  tableId?: string;
  status?: ReservationStatus;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  phone?: string;
  onlyActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ReservationStatisticsDto {
  restaurantId: string;
  totalReservations: number;
  confirmedReservations: number;
  arrivedReservations: number;
  cancelledReservations: number;
  noShowReservations: number;
  completedReservations: number;
  pendingReservations: number;
  averageGuestsPerReservation: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  popularTables: Array<{
    tableId: string;
    tableName: string;
    reservationCount: number;
  }>;
  revenue?: number;
  averageReservationDuration?: number;
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

export const ReservationsService = {
  // Основные операции
  createReservation: async (dto: CreateReservationDto): Promise<ReservationDto> => {
    const { data } = await api.post('/reservations', dto);
    return data;
  },

  getReservationById: async (id: string): Promise<ReservationDto> => {
    const { data } = await api.get(`/reservations/${id}`);
    return data;
  },

  getReservations: async (query: ReservationQueryDto): Promise<any> => {
    const { data } = await api.get('/reservations', { params: query });
    return data;
  },

  updateReservation: async (id: string, dto: UpdateReservationDto): Promise<ReservationDto> => {
    const { data } = await api.patch(`/reservations/${id}`, dto);
    return data;
  },

  // Специальные операции статуса
  cancelReservation: async (id: string): Promise<ReservationDto> => {
    const { data } = await api.post(`/reservations/${id}/cancel`);
    return data;
  },

  markAsArrived: async (id: string): Promise<ReservationDto> => {
    const { data } = await api.post(`/reservations/${id}/arrived`);
    return data;
  },

  completeReservation: async (id: string): Promise<ReservationDto> => {
    const { data } = await api.post(`/reservations/${id}/complete`);
    return data;
  },

  markAsNoShow: async (id: string): Promise<ReservationDto> => {
    const { data } = await api.post(`/reservations/${id}/no-show`);
    return data;
  },

  deleteReservation: async (id: string): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  },

  // Групповые операции
  getUpcomingReservations: async (
    restaurantId: string,
    hours: number = 24
  ): Promise<ReservationDto[]> => {
    const { data } = await api.get(`/reservations/upcoming/${restaurantId}`, {
      params: { hours }
    });
    return data;
  },

  getReservationStatistics: async (
    restaurantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReservationStatisticsDto> => {
    const params: any = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const { data } = await api.get(`/reservations/statistics/restaurant/${restaurantId}`, {
      params
    });
    return data;
  },

  // Операции по столам
  getReservationsByTable: async (
    tableId: string,
    query?: ReservationQueryDto
  ): Promise<PaginatedResponse<ReservationDto>> => {
    const { data } = await api.get(`/reservations/table/${tableId}`, {
      params: query
    });
    return data;
  },

  getCurrentReservationByTable: async (tableId: string): Promise<ReservationDto | null> => {
    try {
      const { data } = await api.get(`/reservations/table/${tableId}/current`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getUpcomingReservationsByTable: async (
    tableId: string,
    hours: number = 24
  ): Promise<ReservationDto[]> => {
    const { data } = await api.get(`/reservations/table/${tableId}/upcoming`, {
      params: { hours }
    });
    return data;
  },

  getTableReservationHistory: async (
    tableId: string,
    days: number = 30
  ): Promise<ReservationDto[]> => {
    const { data } = await api.get(`/reservations/table/${tableId}/history`, {
      params: { days }
    });
    return data;
  },

  // Утилиты
  getStatusColor: (status: ReservationStatus): string => {
    const colors = {
      [ReservationStatus.PENDING]: '#F59E0B', // amber
      [ReservationStatus.CONFIRMED]: '#10B981', // green
      [ReservationStatus.ARRIVED]: '#3B82F6', // blue
      [ReservationStatus.COMPLETED]: '#8B5CF6', // violet
      [ReservationStatus.CANCELLED]: '#EF4444', // red
      [ReservationStatus.NO_SHOW]: '#6B7280', // gray
    };
    return colors[status] || '#6B7280';
  },

  getStatusLabel: (status: ReservationStatus): string => {
    const labels = {
      [ReservationStatus.PENDING]: 'Ожидает подтверждения',
      [ReservationStatus.CONFIRMED]: 'Подтверждено',
      [ReservationStatus.ARRIVED]: 'Клиент прибыл',
      [ReservationStatus.COMPLETED]: 'Завершено',
      [ReservationStatus.CANCELLED]: 'Отменено',
      [ReservationStatus.NO_SHOW]: 'Клиент не явился',
    };
    return labels[status] || 'Неизвестно';
  },

  getSourceLabel: (source: ReservationSource): string => {
    const labels = {
      [ReservationSource.PANEL]: 'Панель администратора',
      [ReservationSource.WEBSITE]: 'Сайт ресторана',
      [ReservationSource.MOBILE_APP]: 'Мобильное приложение',
      [ReservationSource.YANDEX_FOOD]: 'Яндекс Еда',
    };
    return labels[source] || 'Неизвестно';
  },

  getStatusIcon: (status: ReservationStatus): string => {
    const icons = {
      [ReservationStatus.PENDING]: '⏳',
      [ReservationStatus.CONFIRMED]: '✅',
      [ReservationStatus.ARRIVED]: '📍',
      [ReservationStatus.COMPLETED]: '🏁',
      [ReservationStatus.CANCELLED]: '❌',
      [ReservationStatus.NO_SHOW]: '👤',
    };
    return icons[status] || '❓';
  },

  canCancelReservation: (reservation: ReservationDto): boolean => {
    const now = new Date();
    const reservationTime = new Date(reservation.reservationTime);
    const hoursDiff = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return (
      (reservation.status === ReservationStatus.PENDING ||
       reservation.status === ReservationStatus.CONFIRMED)
    );
  },

  canMarkAsArrived: (reservation: ReservationDto): boolean => {
    const now = new Date();
    const reservationTime = new Date(reservation.reservationTime);
    const timeDiff = Math.abs(now.getTime() - reservationTime.getTime()) / (1000 * 60);
    
    return (
      reservation.status === ReservationStatus.CONFIRMED &&
      timeDiff <= 30 
    );
  },

  getTimeUntilReservation: (reservationTime: Date): string => {
    const now = new Date();
    const time = new Date(reservationTime);
    const diffMs = time.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return 'Прошло';
    }

    if (diffHours === 0) {
      return `через ${diffMinutes} мин`;
    } else if (diffHours < 24) {
      return `через ${diffHours} ч ${diffMinutes} мин`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `через ${diffDays} дн`;
    }
  },

  isReservationActiveNow: (reservation: ReservationDto): boolean => {
    const now = new Date();
    const reservationTime = new Date(reservation.reservationTime);
    const endTime = new Date(reservationTime.getTime() + 2 * 60 * 60 * 1000); // +2 часа
    
    return (
      (reservation.status === ReservationStatus.CONFIRMED ||
       reservation.status === ReservationStatus.ARRIVED) &&
      now >= reservationTime &&
      now <= endTime
    );
  },

  isUpcomingReservation: (reservation: ReservationDto, hoursThreshold: number = 24): boolean => {
    const now = new Date();
    const reservationTime = new Date(reservation.reservationTime);
    const timeDiff = reservationTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return (
      (reservation.status === ReservationStatus.PENDING ||
       reservation.status === ReservationStatus.CONFIRMED) &&
      hoursDiff <= hoursThreshold &&
      hoursDiff > 0
    );
  },

  groupReservationsByDate: (reservations: ReservationDto[]): Record<string, ReservationDto[]> => {
    const groups: Record<string, ReservationDto[]> = {};
    
    reservations.forEach(reservation => {
      const date = new Date(reservation.reservationTime);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(reservation);
    });
    
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => 
        new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime()
      );
    });
    
    return groups;
  },

  filterReservationsByStatus: (
    reservations: ReservationDto[],
    status: ReservationStatus
  ): ReservationDto[] => {
    return reservations.filter(reservation => reservation.status === status);
  },

  getGuestsCountByDate: (
    reservations: ReservationDto[],
    date: Date
  ): number => {
    const dateStr = date.toISOString().split('T')[0];
    
    return reservations.reduce((total, reservation) => {
      const reservationDate = new Date(reservation.reservationTime);
      const reservationDateStr = reservationDate.toISOString().split('T')[0];
      
      if (reservationDateStr === dateStr && 
          reservation.status !== ReservationStatus.CANCELLED &&
          reservation.status !== ReservationStatus.NO_SHOW) {
        return total + reservation.numberOfPeople;
      }
      return total;
    }, 0);
  },

  formatReservationDateTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatReservationTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatReservationDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  },

  getReservationDuration: (reservation: ReservationDto): number => {
    return 2; // стандартная продолжительность бронирования
  },

  // Этот метод остался, но в контроллере нет соответствующего endpoint-а
  // Можно либо удалить его, либо реализовать на бекенде
  checkTableAvailability: async (
    tableId: string,
    reservationTime: string,
    durationHours: number = 2
  ): Promise<boolean> => {
    try {
      const startTime = new Date(reservationTime);
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
      
      const reservations = await ReservationsService.getReservationsByTable(tableId, {
        startDate: startTime.toISOString(),
        endDate: endTime.toISOString(),
        status: ReservationStatus.CONFIRMED,
        onlyActive: true
      });
      
      return reservations.data.length === 0;
    } catch (error) {
      console.error('Ошибка проверки доступности стола:', error);
      return false;
    }
  },
};