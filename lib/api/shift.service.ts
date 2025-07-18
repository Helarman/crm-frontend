import axios from 'axios';
import { UserService } from './user.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Интерсепторы и вспомогательные функции остаются без изменений
api.interceptors.request.use((config) => {
  const token = getAccessTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setNewAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        failedRequestsQueue.forEach(pending => pending.resolve(data.accessToken));
        return api(originalRequest);
      } catch (refreshError) {
        failedRequestsQueue.forEach(pending => pending.reject(refreshError));
        clearAuthData();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        failedRequestsQueue = [];
      }
    }
    
    return Promise.reject(error);
  }
);

function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; accessToken=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
}

function setNewAccessToken(token: string) {
  document.cookie = `accessToken=${token}; path=/; max-age=3600`;
}

function clearAuthData() {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

interface ShiftExpense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateShiftExpenseDto {
  title: string;
  amount: number;
  description?: string;
}

interface UpdateShiftExpenseDto {
  title?: string;
  amount?: number;
  description?: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PAUSED';
  restaurantId: string;
  restaurant: {
    id: string;
    title: string;
  };
  staffCount: number;
  completedOrders: number;
  description?: string;
  users: {
    userId: string;
    user: {
      email: string;
      role: string;
    }
  }[];
  orders: {
    id: string,
    number: string,
    status: any,
    totalAmount: any,
    createdAt: any,
    type: string,
    payment: any
  }[];
  expenses: ShiftExpense[];
  incomes: ShiftIncome[];
}

interface ShiftIncome {
  id: string;
  title: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateShiftIncomeDto {
  title: string;
  amount: number;
  description?: string;
}

interface UpdateShiftIncomeDto {
  title?: string;
  amount?: number;
  description?: string;
}

interface CreateShiftDto {
  restaurantId: string;
  startTime: Date;
  endTime?: Date;
  status?: string;
  name?: string;
  description?: string;
}

interface UpdateShiftStatusDto {
  status: 'PLANNED' | 'STARTED' | 'COMPLETED';
}

interface ManageShiftUserDto {
  userId: string;
  role?: string;
}

interface ManageShiftOrderDto {
  orderId: string;
}

interface GetShiftsDto {
  restaurantId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const ShiftService = {
  // Получить все смены с пагинацией и фильтрацией
  async getAllShifts(query: GetShiftsDto): Promise<{ 
    data: Shift[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number 
  }> {
    const { data } = await api.get('/shifts', { 
      params: { 
        restaurantId: query.restaurantId,
        status: query.status,
        page: query.page,
        limit: query.limit
      } 
    });
    return data;
  },

  // Создать новую смену
  async createShift(dto: CreateShiftDto): Promise<Shift> {
    const { data } = await api.post('/shifts', dto);
    return data;
  },

  // Обновить статус смены
  async updateShiftStatus(shiftId: string, dto: UpdateShiftStatusDto): Promise<Shift> {
    const { data } = await api.put(`/shifts/${shiftId}/status`, dto);
    return data;
  },
  async addUserToShiftByEmail(shiftId: string, dto: { email: string }): Promise<Shift> {
    // First get the user by email
    const user = await UserService.getByEmail(dto.email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Then add the user to the shift
    const { data } = await api.post(`/shifts/${shiftId}/users`, { 
      userId: user.id
    });
    
    return data;
  },
  // Добавить пользователя в смену
  async addUserToShift(shiftId: string, dto: ManageShiftUserDto): Promise<Shift> {
    const { data } = await api.post(`/shifts/${shiftId}/users`, dto);
    return data;
  },

  // Удалить пользователя из смены
  async removeUserFromShift(shiftId: string, userId: string): Promise<void> {
    await api.delete(`/shifts/${shiftId}/users/${userId}`);
  },

  // Получить детали смены
  async getShiftDetails(shiftId: string): Promise<Shift> {
    const { data } = await api.get(`/shifts/${shiftId}`);
    return data;
  },

  // Получить смены по ресторану (устаревший метод, лучше использовать getAllShifts)
  async getShiftsByRestaurant(restaurantId: string): Promise<Shift[]> {
    const { data } = await api.get(`/shifts/restaurant/${restaurantId}`);
    return data;
  },

  async getActiveShiftsByRestaurant(restaurantId: string): Promise<Shift> {
    const { data } = await api.get(`/shifts/restaurant/${restaurantId}/active`);
    return data[0];
  },

  // Получить смены по статусу (устаревший метод, лучше использовать getAllShifts)
  async getShiftsByStatus(status: string): Promise<Shift[]> {
    const { data } = await api.get('/shifts', { params: { status } });
    return data;
  },

  // Получить текущие смены пользователя
  async getCurrentUserShifts(): Promise<Shift[]> {
    const { data } = await api.get('/shifts/current-user');
    return data;
  },

  // Добавить заказ в смену
  async addOrderToShift(shiftId: string, dto: ManageShiftOrderDto): Promise<Shift> {
    const { data } = await api.post(`/shifts/${shiftId}/orders`, dto);
    return data;
  },

  // Удалить заказ из смены
  async removeOrderFromShift(shiftId: string, orderId: string): Promise<void> {
    await api.delete(`/shifts/${shiftId}/orders/${orderId}`);
  },

  // Получить заказы смены
  async getShiftOrders(shiftId: string): Promise<any[]> {
    const { data } = await api.get(`/shifts/${shiftId}/orders`);
    return data;
  },

  // Дополнительные методы для удобства
  async getActiveShifts(): Promise<Shift[]> {
    return this.getAllShifts({ status: 'ACTIVE' }).then(res => res.data);
  },

  async getCompletedShifts(): Promise<Shift[]> {
    return this.getAllShifts({ status: 'COMPLETED' }).then(res => res.data);
  },

    // Добавить расход к смене
  async addExpenseToShift(shiftId: string, dto: CreateShiftExpenseDto): Promise<ShiftExpense> {
    const { data } = await api.post(`/shifts/${shiftId}/expenses`, dto);
    return data;
  },

  // Получить расходы смены
  async getShiftExpenses(shiftId: string): Promise<ShiftExpense[]> {
    const { data } = await api.get(`/shifts/${shiftId}/expenses`);
    return data;
  },

  // Удалить расход
  async removeExpense(expenseId: string): Promise<void> {
    await api.delete(`/shifts/expenses/${expenseId}`);
  },

  // Обновить расход
  async updateExpense(expenseId: string, dto: UpdateShiftExpenseDto): Promise<ShiftExpense> {
    const { data } = await api.put(`/shifts/expenses/${expenseId}`, dto);
    return data;
  },

  // Получить общую сумму расходов смены
  async getShiftTotalExpenses(shiftId: string): Promise<number> {
    const expenses = await this.getShiftExpenses(shiftId);
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  },
  async addIncomeToShift(shiftId: string, dto: CreateShiftIncomeDto): Promise<ShiftIncome> {
    const { data } = await api.post(`/shifts/${shiftId}/incomes`, dto);
    return data;
  },

  // Получить доходы смены
  async getShiftIncomes(shiftId: string): Promise<ShiftIncome[]> {
    const { data } = await api.get(`/shifts/${shiftId}/incomes`);
    return data;
  },

  // Удалить доход
  async removeIncome(incomeId: string): Promise<void> {
    await api.delete(`/shifts/incomes/${incomeId}`);
  },

  // Обновить доход
  async updateIncome(incomeId: string, dto: UpdateShiftIncomeDto): Promise<ShiftIncome> {
    const { data } = await api.put(`/shifts/incomes/${incomeId}`, dto);
    return data;
  },

  // Получить общую сумму доходов смены
  async getShiftTotalIncomes(shiftId: string): Promise<number> {
    const incomes = await this.getShiftIncomes(shiftId);
    return incomes.reduce((total, income) => total + income.amount, 0);
  },

  // Получить финансовый отчет смены (доходы - расходы)
  async getShiftFinancialReport(shiftId: string): Promise<{
    totalIncomes: number;
    totalExpenses: number;
    profit: number;
  }> {
    const [incomes, expenses] = await Promise.all([
      this.getShiftIncomes(shiftId),
      this.getShiftExpenses(shiftId)
    ]);
    
    const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      totalIncomes,
      totalExpenses,
      profit: totalIncomes - totalExpenses
    };
  }
};