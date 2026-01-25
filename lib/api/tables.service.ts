import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface HallDto {
  id: string;
  title: string;
  description?: string;
  polygon?: string; // GeoJSON полигон
  color: string;
  order: number;
  isActive: boolean;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  tables?: TableDto[];
}

export enum TableShape {
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  OVAL = 'OVAL',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  CLEANING = 'CLEANING',
}

export interface TableDto {
  id: string;
  name: string;
  description?: string;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  order: number;
  isActive: boolean;
  hallId: string;
  parentTableId?: string;
  hall?: HallDto;
  tags?: TableTagDto[];
  childTables?: TableDto[];
  parentTable?: TableDto;
  currentOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableTagDto {
  id: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  isActive: boolean;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
  tables?: TableDto[];
}

export interface CreateHallDto {
  title: string;
  description?: string;
  polygon?: string;
  color?: string;
  order?: number;
  restaurantId: string;
}

export interface UpdateHallDto {
  title?: string;
  description?: string;
  polygon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateTableDto {
  name: string;
  description?: string;
  seats: number;
  shape?: TableShape;
  status?: TableStatus;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  order?: number;
  hallId: string;
  parentTableId?: string;
  tagIds?: string[];
}

export interface UpdateTableDto {
  name?: string;
  description?: string;
  seats?: number;
  status?: TableStatus;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: string;
  order?: number;
  isActive?: boolean;
  parentTableId?: string;
  tagIds?: string[];
}

export interface CreateTableTagDto {
  name: string;
  description?: string;
  color?: string;
  order?: number;
  restaurantId: string;
}

export interface UpdateTableTagDto {
  name?: string;
  description?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface CombineTablesDto {
  mainTableId: string;
  tableIds: string[];
  combinedTableName?: string;
  keepOriginalTables?: boolean;
}

export interface TableQueryDto {
  restaurantId?: string;
  hallId?: string;
  status?: TableStatus;
  minSeats?: number;
  maxSeats?: number;
  tagId?: string;
  includeInactive?: boolean;
  onlyCombined?: boolean;
  onlyMainTables?: boolean;
  page?: number;
  limit?: number;
}

export interface TableStatisticsDto {
  restaurantId: string;
  halls: number;
  totalTables: number;
  totalSeats: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  combinedTables: number;
  occupancyRate: number;
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

export const TablesService = {
  // ========== ЗАЛЫ ==========

  /**
   * Создать новый зал
   */
  createHall: async (dto: CreateHallDto): Promise<HallDto> => {
    const { data } = await api.post('/tables/halls', dto);
    return data;
  },

  /**
   * Получить зал по ID
   */
  getHallById: async (id: string): Promise<HallDto> => {
    const { data } = await api.get(`/tables/halls/${id}`);
    return data;
  },

  /**
   * Получить все залы ресторана
   */
  getHallsByRestaurant: async (
    restaurantId: string,
    includeInactive: boolean = false
  ): Promise<HallDto[]> => {
    const { data } = await api.get(`/tables/halls/restaurant/${restaurantId}`, {
      params: { includeInactive }
    });
    return data;
  },

  /**
   * Обновить зал
   */
  updateHall: async (id: string, dto: UpdateHallDto): Promise<HallDto> => {
    const { data } = await api.patch(`/tables/halls/${id}`, dto);
    return data;
  },

  /**
   * Удалить зал
   */
  deleteHall: async (id: string): Promise<void> => {
    await api.delete(`/tables/halls/${id}`);
  },

  // ========== СТОЛЫ ==========

  /**
   * Создать новый стол
   */
  createTable: async (dto: CreateTableDto): Promise<TableDto> => {
    const { data } = await api.post('/tables/tables', dto);
    return data;
  },

  /**
   * Получить стол по ID
   */
  getTableById: async (id: string): Promise<TableDto> => {
    const { data } = await api.get(`/tables/tables/${id}`);
    return data;
  },

  /**
   * Получить все столы с фильтрацией
   */
  getTables: async (query: TableQueryDto): Promise<PaginatedResponse<TableDto>> => {
    const { data } = await api.get('/tables/tables', { params: query });
    return data;
  },

  /**
   * Обновить стол
   */
  updateTable: async (id: string, dto: UpdateTableDto): Promise<TableDto> => {
    const { data } = await api.patch(`/tables/tables/${id}`, dto);
    return data;
  },

  /**
   * Изменить статус стола
   */
  updateTableStatus: async (
    id: string,
    status: TableStatus,
    orderId?: string
  ): Promise<TableDto> => {
    const { data } = await api.patch(`/tables/tables/${id}/status`, { status, orderId });
    return data;
  },

  /**
   * Удалить стол
   */
  deleteTable: async (id: string): Promise<void> => {
    await api.delete(`/tables/tables/${id}`);
  },

  /**
   * Получить доступные столы
   */
  getAvailableTables: async (
    hallId: string,
    requiredSeats: number,
    excludeTableId?: string
  ): Promise<TableDto[]> => {
    const { data } = await api.get('/tables/tables/available', {
      params: { hallId, requiredSeats, excludeTableId }
    });
    return data;
  },

  // ========== ОБЪЕДИНЕНИЕ СТОЛОВ ==========

  /**
   * Объединить столы
   */
  combineTables: async (dto: CombineTablesDto): Promise<TableDto> => {
    const { data } = await api.post('/tables/tables/combine', dto);
    return data;
  },

  /**
   * Разъединить объединенный стол
   */
  separateTables: async (combinedTableId: string): Promise<TableDto[]> => {
    const { data } = await api.post(`/tables/tables/${combinedTableId}/separate`);
    return data;
  },

  // ========== ТЕГИ СТОЛОВ ==========

  /**
   * Создать новый тег для столов
   */
  createTableTag: async (dto: CreateTableTagDto): Promise<TableTagDto> => {
    const { data } = await api.post('/tables/tags', dto);
    return data;
  },

  /**
   * Получить тег по ID
   */
  getTableTagById: async (id: string): Promise<TableTagDto> => {
    const { data } = await api.get(`/tables/tags/${id}`);
    return data;
  },

  /**
   * Получить все теги ресторана
   */
  getTableTagsByRestaurant: async (
    restaurantId: string,
    includeInactive: boolean = false
  ): Promise<TableTagDto[]> => {
    const { data } = await api.get(`/tables/tags/restaurant/${restaurantId}`, {
      params: { includeInactive }
    });
    return data;
  },

  /**
   * Обновить тег
   */
  updateTableTag: async (id: string, dto: UpdateTableTagDto): Promise<TableTagDto> => {
    const { data } = await api.patch(`/tables/tags/${id}`, dto);
    return data;
  },

  /**
   * Удалить тег
   */
  deleteTableTag: async (id: string): Promise<void> => {
    await api.delete(`/tables/tags/${id}`);
  },

  // ========== СТАТИСТИКА ==========

  /**
   * Получить статистику по столам ресторана
   */
  getTableStatistics: async (restaurantId: string): Promise<TableStatisticsDto> => {
    const { data } = await api.get(`/tables/statistics/restaurant/${restaurantId}`);
    return data;
  },

  // ========== УТИЛИТНЫЕ МЕТОДЫ ==========

  /**
   * Получить цвет статуса стола
   */
  getStatusColor: (status: TableStatus): string => {
    const colors = {
      [TableStatus.AVAILABLE]: '#10B981', // green
      [TableStatus.OCCUPIED]: '#EF4444', // red
      [TableStatus.RESERVED]: '#F59E0B', // amber
      [TableStatus.OUT_OF_SERVICE]: '#6B7280', // gray
      [TableStatus.CLEANING]: '#3B82F6', // blue
    };
    return colors[status] || '#6B7280';
  },

  /**
   * Получить название статуса стола на русском
   */
  getStatusLabel: (status: TableStatus): string => {
    const labels = {
      [TableStatus.AVAILABLE]: 'Свободен',
      [TableStatus.OCCUPIED]: 'Занят',
      [TableStatus.RESERVED]: 'Забронирован',
      [TableStatus.OUT_OF_SERVICE]: 'Не обслуживается',
      [TableStatus.CLEANING]: 'На уборке',
    };
    return labels[status] || 'Неизвестно';
  },

  /**
   * Получить название формы стола на русском
   */
  getShapeLabel: (shape: TableShape): string => {
    const labels = {
      [TableShape.RECTANGLE]: 'Прямоугольный',
      [TableShape.CIRCLE]: 'Круглый',
      [TableShape.SQUARE]: 'Квадратный',
      [TableShape.OVAL]: 'Овальный',
    };
    return labels[shape] || 'Неизвестно';
  },

  /**
   * Получить иконку формы стола
   */
  getShapeIcon: (shape: TableShape): string => {
    const icons = {
      [TableShape.RECTANGLE]: '□',
      [TableShape.CIRCLE]: '○',
      [TableShape.SQUARE]: '■',
      [TableShape.OVAL]: '⬯',
    };
    return icons[shape] || '□';
  },

  /**
   * Проверить, можно ли объединить столы
   */
  canCombineTables: (tables: TableDto[]): boolean => {
    if (tables.length < 2) return false;
    
    return tables.every(table => 
      table.status === TableStatus.AVAILABLE &&
      table.isActive &&
      !table.parentTableId &&
      table.childTables?.length === 0
    );
  },

  /**
   * Рассчитать общее количество мест в объединенных столах
   */
  calculateCombinedSeats: (tables: TableDto[]): number => {
    return tables.reduce((sum, table) => sum + table.seats, 0);
  },

  /**
   * Получить все дочерние столы (рекурсивно)
   */
  getAllChildTables: (table: TableDto): TableDto[] => {
    const children: TableDto[] = [];
    
    const collectChildren = (t: TableDto) => {
      if (t.childTables && t.childTables.length > 0) {
        t.childTables.forEach(child => {
          children.push(child);
          collectChildren(child);
        });
      }
    };
    
    collectChildren(table);
    return children;
  },

  /**
   * Проверить, является ли стол объединенным
   */
  isCombinedTable: (table: TableDto): boolean => {
    return !table.parentTableId && (table.childTables?.length || 0) > 0;
  },

  /**
   * Получить полное дерево столов зала
   */
  getTablesTree: (tables: TableDto[]): TableDto[] => {
    const tableMap = new Map<string, TableDto>();
    const rootTables: TableDto[] = [];

    // Создаем карту таблиц
    tables.forEach(table => {
      tableMap.set(table.id, { ...table, childTables: [] });
    });

    // Строим иерархию
    tables.forEach(table => {
      const tableNode = tableMap.get(table.id)!;
      
      if (table.parentTableId) {
        const parent = tableMap.get(table.parentTableId);
        if (parent) {
          parent.childTables!.push(tableNode);
        }
      } else {
        rootTables.push(tableNode);
      }
    });

    return rootTables;
  },

  /**
   * Форматировать дату
   */
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Форматировать дату и время
   */
  formatDateTime: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
};