'use client';

import { useShift, useShiftUsers } from '@/lib/hooks/useShifts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, RussianRuble, Users, User, Plus, Trash2, Edit, BanknoteArrowUp, BanknoteArrowDown, PlusCircle, MinusCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { AccessCheck } from '@/components/AccessCheck';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { ShiftService } from '@/lib/api/shift.service';
import { toast } from 'sonner';
import { useRestaurantUsers } from '@/lib/hooks/useRestaurant';
import { User as UserType } from '@/lib/types/user';
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';
import { useDictionaries } from '@/lib/hooks/useDictionaries';

const translations = {
  ru: {
    shiftStats: 'Статистика смены',
    orders: 'Заказы',
    staff: 'Персонал',
    expenses: 'Расходы',
    incomes: 'Доходы',
    orderId: 'Номер',
    status: 'Статус',
    amount: 'Сумма',
    createdAt: 'Дата создания',
    user: 'Пользователь',
    role: 'Роль',
    back: 'Назад',
    loading: 'Загрузка...',
    noOrders: 'Заказы не найдены',
    noStaff: 'Персонал не назначен',
    noExpenses: 'Расходы не добавлены',
    noIncomes: 'Доходы не добавлены',
    totalOrders: 'Всего заказов',
    totalAmount: 'Общая сумма',
    totalExpenses: 'Общие расходы',
    totalIncomes: 'Общие доходы',
    staffCount: 'Количество персонала',
    created: 'Создан',
    confirmed: 'Подтверждён',
    preparing: 'Готовится',
    ready: 'Готов',
    delivering: 'Доставляется',
    completed: 'Завершён',
    cancelled: 'Отменён',
    admin: 'Администратор',
    manager: 'Менеджер',
    waiter: 'Официант',
    chef: 'Повар',
    addStaff: 'Добавить в смену',
    removeFromShift: 'Удалить из смены',
    addExpense: 'Добавить расход',
    editExpense: 'Редактировать расход',
    addIncome: 'Добавить доход',
    editIncome: 'Редактировать доход',
    expenseTitle: 'Название',
    expenseAmount: 'Сумма',
    expenseDescription: 'Описание',
    incomeTitle: 'Название',
    incomeAmount: 'Сумма',
    incomeDescription: 'Описание',
    actions: 'Действия',
    success: 'Успех',
    userAddedSuccessfully: 'Пользователь успешно добавлен в смену',
    userRemovedSuccessfully: 'Пользователь успешно удалён из смены',
    expenseAdded: 'Расход добавлен',
    expenseRemoved: 'Расход удалён',
    expenseUpdated: 'Расход обновлён',
    incomeAdded: 'Доход добавлен',
    incomeRemoved: 'Доход удалён',
    incomeUpdated: 'Доход обновлён',
    error: 'Ошибка',
    somethingWentWrong: 'Что-то пошло не так',
    balance: 'Баланс',
    restaurantStaff: 'Сотрудники ресторана',
    shiftStaff: 'Сотрудники в смене',
    noRestaurantStaff: 'Нет доступных сотрудников',
    shiftCompleted: 'Смена завершена, изменения невозможны',
    selectUser: 'Выберите сотрудника',
    selected: 'Выбрано',
    save: 'Сохранить',
    add: 'Добавить',
    cancel: 'Отмена',
    revenue: 'Выручка',
    cashPayment: 'Оплата наличными',
    cardPayment: 'Оплата картой',
    onlinePayment: 'Онлайн оплата',
    banquet: 'Банкет',
    delivery: 'Доставка',
    dineIn: 'Зал',
    takeaway: 'На вынос',
    searchReason: 'Поиск причины...',
    noReasonsFound: 'Причины не найдены',
    otherIncome: 'Иные поступления',
    beznal: 'Безнал',
    expensesTotal: 'Расход',
    cashBalance: 'Остаток',
    cashInSafe: 'Денег в кассе',
    loadingReasons: 'Загрузка причин...',
    noExpenseReasons: 'Нет доступных причин расходов',
    noIncomeReasons: 'Нет доступных причин доходов',
  },
  ka: {
    shiftStats: 'ცვლის სტატისტიკა',
    orders: 'შეკვეთები',
    staff: 'პერსონალი',
    expenses: 'ხარჯები',
    incomes: 'შემოსავლები',
    orderId: 'რიცხვი',
    status: 'სტატუსი',
    amount: 'თანხა',
    createdAt: 'შექმნის თარიღი',
    user: 'მომხმარებელი',
    role: 'როლი',
    back: 'უკან',
    searchReason: 'მიზეზის ძიება...',
    noReasonsFound: 'მიზეზები ვერ მოიძებნა',
    loading: 'იტვირთება...',
    noOrders: 'შეკვეთები არ მოიძებნა',
    noStaff: 'პერსონალი არ არის დანიშნული',
    noExpenses: 'ხარჯები არ არის დამატებული',
    noIncomes: 'შემოსავლები არ არის დამატებული',
    totalOrders: 'შეკვეთების ჯამი',
    totalAmount: 'ჯამური თანხა',
    totalExpenses: 'ხარჯების ჯამი',
    totalIncomes: 'შემოსავლის ჯამი',
    staffCount: 'პერსონალის რაოდენობა',
    created: 'შექმნილია',
    confirmed: 'დადასტურებულია',
    preparing: 'მზადდება',
    ready: 'მზადაა',
    delivering: 'მიწოდება',
    completed: 'დასრულებულია',
    cancelled: 'გაუქმებულია',
    admin: 'ადმინისტრატორი',
    manager: 'მენეჯერი',
    waiter: 'მიმტანი',
    chef: 'მზარეული',
    addStaff: 'ცვლაში დამატება',
    removeFromShift: 'ცვლიდან ამოღება',
    addExpense: 'ხარჯის დამატება',
    editExpense: 'ხარჯის რედაქტირება',
    addIncome: 'შემოსავლის დამატება',
    editIncome: 'შემოსავლის რედაქტირება',
    expenseTitle: 'სათაური',
    expenseAmount: 'თანხა',
    expenseDescription: 'აღწერა',
    incomeTitle: 'სათაური',
    incomeAmount: 'თანხა',
    incomeDescription: 'აღწერა',
    actions: 'მოქმედებები',
    წარმატება: 'წარმატება',
    userAddedSuccessfully: 'მომხმარებელი წარმატებით დაემატა ცვლას',
    userRemovedSuccessfully: 'მომხმარებელი წარმატებით წაიშალა ცვლადან',
    expenseAdded: 'ხარჯი დაემატა',
    expenseRemoved: 'ხარჯი წაიშალა',
    expenseUpdated: 'ხარჯი განახლდა',
    incomeAdded: 'შემოსავალი დაემატა',
    incomeRemoved: 'შემოსავალი წაიშალა',
    incomeUpdated: 'შემოსავალი განახლდა',
    error: 'შეცდომა',
    somethingWentWrong: 'რაღაც არასწორად წარიმართა',
    balance: 'ბალანსი',
    restaurantStaff: 'რესტორნის პერსონალი',
    shiftStaff: 'პერსონალი ცვლაში',
    noRestaurantStaff: 'პერსონალი არ არის ხელმისაწვდომი',
    shiftCompleted: 'ცვლა დასრულდა, ცვლილებები შეუძლებელია',
    selectUser: 'პერსონალის არჩევა',
    selected: 'არჩეულია',
    add: 'დამატება',
    save: 'შენახვა',
    cancel: 'გაუქმება',
    revenue: 'შემოსავალი',
    cashPayment: 'ნაღდი ფულით გადახდა',
    cardPayment: 'ბარათით გადახდა',
    onlinePayment: 'ონლაინ გადახდა',
    ბანკეტი: 'ბანკეტი',
    მიტანა: 'მიტანა',
    dineIn: 'დარბაზი',
    takeaway: 'გატანა',
    otherIncome: 'სხვა შემოსავალი',
    beznal: 'უნაღდო',
    expensesTotal: 'ხარჯი',
    cashBalance: 'ბალანსი',
    cashInSafe: 'ნაღდი ფული სალაროში',
    delivery: 'მიწოდება',
    banquet: 'ბანკეტი',
    loadingReasons: 'მიზეზების ჩატვირთვა...',
    noExpenseReasons: 'ხარჯების მიზეზები არ არის ხელმისაწვდომი',
    noIncomeReasons: 'შემოსავლების მიზეზები არ არის ხელმისაწვდომი',
  }
};


type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  lang?: 'ru' | 'ka';
}

function OrderStatusBadge({ status, lang = 'ru' }: OrderStatusBadgeProps) {
  const statusTextMap = {
    CREATED: translations[lang].created,
    CONFIRMED: translations[lang].confirmed,
    PREPARING: translations[lang].preparing,
    READY: translations[lang].ready,
    DELIVERING: translations[lang].delivering,
    COMPLETED: translations[lang].completed,
    CANCELLED: translations[lang].cancelled
  };

  const statusVariantMap: Record<OrderStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
    CREATED: 'secondary',
    CONFIRMED: 'default',
    PREPARING: 'default',
    READY: 'default',
    DELIVERING: 'outline',
    COMPLETED: 'default',
    CANCELLED: 'destructive'
  };

  return (
    <Badge variant={statusVariantMap[status]}>
      {statusTextMap[status]}
    </Badge>
  );
}

interface RoleBadgeProps {
  role: string;
  lang?: 'ru' | 'ka';
}

function RoleBadge({ role, lang = 'ru' }: RoleBadgeProps) {
  const roleTextMap: Record<string, string> = {
    ADMIN: translations[lang].admin,
    MANAGER: translations[lang].manager,
    WAITER: translations[lang].waiter,
    CHEF: translations[lang].chef
  };

  const roleVariantMap: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
    ADMIN: 'destructive',
    MANAGER: 'default',
    WAITER: 'outline',
    CHEF: 'outline'
  };

  return (
    <Badge variant={roleVariantMap[role] || 'secondary'}>
      {roleTextMap[role] || role}
    </Badge>
  );
}

interface ShiftExpense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShiftIncome {
  id: string;
  title: string;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ShiftStatsPage() {
  const router = useRouter()
  const { id } = useParams();
  const { language } = useLanguageStore();
  const t = translations[language];

  const { data: shift, isLoading: isLoadingShift, mutate: mutateShift } = useShift(id as string);
  const { data: staff, isLoading: isLoadingStaff, mutate: mutateStaff } = useShiftUsers(id as string);
  const { data: restaurantUsers } = useRestaurantUsers(shift?.restaurantId || '');

  const [selectedRestaurantUser, setSelectedRestaurantUser] = useState<string | null>(null);
  const [selectedShiftUser, setSelectedShiftUser] = useState<string | null>(null);

  const [expenses, setExpenses] = useState<ShiftExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: 0,
    description: ''
  });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ShiftExpense | null>(null);

  const [incomes, setIncomes] = useState<ShiftIncome[]>([]);
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(false);
  const [newIncome, setNewIncome] = useState({
    title: '',
    amount: 0,
    description: ''
  });
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<ShiftIncome | null>(null);

  const {
    expenseReasons,
    incomeReasons,
    loading: loadingReasons,
    error: reasonsError
  } = useDictionaries(shift?.restaurantId);
  const expenseOptions = expenseReasons
    .filter(reason => reason.isActive)
    .map(reason => ({
      id: reason.name,
      label: reason.name
    }));

  const incomeOptions = incomeReasons
    .filter(reason => reason.isActive)
    .map(reason => ({
      id: reason.name,
      label: reason.name
    }));

  const loadExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const expenses = await ShiftService.getShiftExpenses(id as string);
      setExpenses(expenses);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const loadIncomes = async () => {
    setIsLoadingIncomes(true);
    try {
      const incomes = await ShiftService.getShiftIncomes(id as string);
      setIncomes(incomes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    } finally {
      setIsLoadingIncomes(false);
    }
  };
  useEffect(() => {
    loadExpenses();
    loadIncomes();
  }, [id]);

  const handleAddUserToShift = async () => {
    if (!selectedRestaurantUser) return;

    try {
      await ShiftService.addUserToShift(id as string, { userId: selectedRestaurantUser });
      mutateShift();
      mutateStaff();
      setSelectedRestaurantUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleRemoveUserFromShift = async () => {
    if (!selectedShiftUser) return;
    console.log(selectedShiftUser)
    try {
      await ShiftService.removeUserFromShift(id as string, selectedShiftUser);
      mutateShift();
      mutateStaff();
      setSelectedShiftUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleAddExpense = async () => {
    try {
      if (editingExpense) {
        const updatedExpense = await ShiftService.updateExpense(editingExpense.id, newExpense);
        setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        toast.success(t.expenseUpdated);
      } else {
        const expense = await ShiftService.addExpenseToShift(id as string, newExpense);
        setExpenses([...expenses, expense]);
        toast.success(t.expenseAdded);
      }
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, description: '' });
      setEditingExpense(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await ShiftService.removeExpense(expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
      toast.success(t.expenseRemoved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleEditExpense = (expense: ShiftExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount,
      description: expense.description || ''
    });
    setIsAddingExpense(true);
  };

  const handleAddIncome = async () => {
    try {
      if (editingIncome) {
        const updatedIncome = await ShiftService.updateIncome(editingIncome.id, newIncome);
        setIncomes(incomes.map(i => i.id === updatedIncome.id ? updatedIncome : i));
        toast.success(t.incomeUpdated);
      } else {
        const income = await ShiftService.addIncomeToShift(id as string, newIncome);
        setIncomes([...incomes, income]);
        toast.success(t.incomeAdded);
      }
      setIsAddingIncome(false);
      setNewIncome({ title: '', amount: 0, description: '' });
      setEditingIncome(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      await ShiftService.removeIncome(incomeId);
      setIncomes(incomes.filter(i => i.id !== incomeId));
      toast.success(t.incomeRemoved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    }
  };

  const handleEditIncome = (income: ShiftIncome) => {
    setEditingIncome(income);
    setNewIncome({
      title: income.title,
      amount: income.amount,
      description: income.description || ''
    });
    setIsAddingIncome(true);
  };

  // Основные расчеты
  const totalAmount = shift?.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const balance = totalAmount + totalIncomes - totalExpenses;

  // Расчеты по типам оплаты
  const cashOrders = shift?.orders?.filter(order => order.payment?.method === 'CASH') || [];
  const cardOrders = shift?.orders?.filter(order => order.payment?.method === 'CARD') || [];
  const onlineOrders = shift?.orders?.filter(order => order.payment?.method === 'ONLINE') || [];

  const cashAmount = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const cardAmount = cardOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const onlineAmount = onlineOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Расчеты по типам заказов
  const banquetOrders = shift?.orders?.filter(order => order.type === 'BANQUET') || [];
  const deliveryOrders = shift?.orders?.filter(order => order.type === 'DELIVERY') || [];
  const dineInOrders = shift?.orders?.filter(order => order.type === 'DINE_IN') || [];
  const takeawayOrders = shift?.orders?.filter(order => order.type === 'TAKEAWAY') || [];

  const banquetAmount = banquetOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const deliveryAmount = deliveryOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const dineInAmount = dineInOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const takeawayAmount = takeawayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Расчеты по доходам и кассе
  const otherIncomes = incomes.filter(income => income.title !== 'Безнал').reduce((sum, income) => sum + income.amount, 0);
  const beznalIncomes = incomes.filter(income => income.title === 'Безнал').reduce((sum, income) => sum + income.amount, 0);
  const cashBalance = cashAmount - totalExpenses;
  const cashInSafe = cashBalance + otherIncomes;


  if (isLoadingShift) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>{t.noOrders}</p>
      </div>
    );
  }

  const isShiftCompleted = shift.status === 'COMPLETED';
  const availableUsers = restaurantUsers?.filter((user: UserType) =>
    !staff?.some(s => s.userId === user.id)
  ) || [];

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t.shiftStats}</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
        </div>
        {isShiftCompleted && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p>{t.shiftCompleted}</p>
          </div>
        )}

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.revenue}</CardTitle>
                <BanknoteArrowUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.cashPayment}</CardTitle>
                <BanknoteArrowUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cashAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.cardPayment}</CardTitle>
                <BanknoteArrowUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cardAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.onlinePayment}</CardTitle>
                <BanknoteArrowUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.banquet}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{banquetAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{banquetOrders.length} заказов</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.delivery}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{deliveryOrders.length} заказов</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dineIn}</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dineInAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{dineInOrders.length} заказов</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.takeaway}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{takeawayAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{takeawayOrders.length} заказов</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.otherIncome}</CardTitle>
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{otherIncomes.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.beznal}</CardTitle>
                <BanknoteArrowDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{beznalIncomes.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.expensesTotal}</CardTitle>
                <MinusCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalExpenses.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.cashBalance}</CardTitle>
                <RussianRuble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cashBalance.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.cashInSafe}</CardTitle>
                <RussianRuble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cashInSafe.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 space-y-4 space-x-4'>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t.incomes}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {loadingReasons ? (
                      <div className="flex items-center justify-center">
                        <p>{t.loadingReasons}</p>
                      </div>
                    ) : (
                      <SearchableSelect
                        options={incomeOptions}
                        value={newIncome.title ? [newIncome.title] : []}
                        onChange={(ids) => setNewIncome({ ...newIncome, title: ids[0] || '' })}
                        placeholder={incomeOptions.length === 0 ? t.noIncomeReasons : t.incomeTitle}
                        searchPlaceholder={t.searchReason}
                        emptyText={t.noReasonsFound}
                        multiple={false}
                        className="w-full"
                        disabled={incomeOptions.length === 0}
                      />
                    )}

                    <Input
                      type="number"
                      placeholder={t.incomeAmount}
                      value={newIncome.amount}
                      onChange={(e) => setNewIncome({ ...newIncome, amount: Number(e.target.value) })}
                    />

                    <Input
                      placeholder={t.incomeDescription}
                      value={newIncome.description}
                      onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                    />

                    <Button
                      onClick={handleAddIncome}
                      disabled={!newIncome.title || newIncome.amount <= 0 || incomeOptions.length === 0}
                    >
                      {editingIncome ? t.save : t.add}
                    </Button>
                  </div>
                </div>

                {isLoadingIncomes ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : incomes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.incomeTitle}</TableHead>
                        <TableHead>{t.incomeAmount}</TableHead>
                        <TableHead>{t.incomeDescription}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomes.map((income) => (
                        <TableRow key={income.id}>
                          <TableCell className="font-medium">{income.title}</TableCell>
                          <TableCell>{income.amount.toFixed(2)}</TableCell>
                          <TableCell>{income.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIncome(income.id)}
                              disabled={isShiftCompleted}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t.noIncomes}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t.expenses}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {loadingReasons ? (
                      <div className="flex items-center justify-center">
                        <p>{t.loadingReasons}</p>
                      </div>
                    ) : (
                      <SearchableSelect
                        options={expenseOptions}
                        value={newExpense.title ? [newExpense.title] : []}
                        onChange={(ids) => setNewExpense({ ...newExpense, title: ids[0] || '' })}
                        placeholder={expenseOptions.length === 0 ? t.noExpenseReasons : t.expenseTitle}
                        searchPlaceholder={t.searchReason}
                        emptyText={t.noReasonsFound}
                        multiple={false}
                        className="w-full"
                        disabled={expenseOptions.length === 0}
                      />
                    )}

                    <Input
                      type="number"
                      placeholder={t.expenseAmount}
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    />

                    <Input
                      placeholder={t.expenseDescription}
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />

                    <Button
                      onClick={handleAddExpense}
                      disabled={!newExpense.title || newExpense.amount <= 0 || expenseOptions.length === 0}
                    >
                      {editingExpense ? t.save : t.add}
                    </Button>
                  </div>
                </div>

                {isLoadingExpenses ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : expenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.expenseTitle}</TableHead>
                        <TableHead>{t.expenseAmount}</TableHead>
                        <TableHead>{t.expenseDescription}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.title}</TableCell>
                          <TableCell>{expense.amount.toFixed(2)}</TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={isShiftCompleted}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t.noExpenses}</p>
                )}
              </CardContent>
            </Card>
          </div>


          <Card>
            <CardHeader>
              <CardTitle>{t.staff}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">{t.restaurantStaff}</h3>
                    {selectedRestaurantUser && (
                      <span className="text-sm text-muted-foreground">
                        {t.selected}: 1
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 h-96 overflow-y-auto border rounded-lg p-2">
                    {availableUsers.length > 0 ? (
                      availableUsers.map((user: UserType) => (
                        <div
                          key={user.id}
                          className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${selectedRestaurantUser === user.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'hover:bg-accent'
                            }`}
                          onClick={() => setSelectedRestaurantUser(user.id)}
                        >
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <RoleBadge role={user.role} lang={language} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {t.noRestaurantStaff}
                      </p>
                    )}
                  </div>

                </div>
                <div className='flex flex-col justify-center items-center'>
                  <Button
                    className="mt-4"
                    onClick={handleAddUserToShift}
                    disabled={!selectedRestaurantUser || isShiftCompleted}
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    {t.addStaff}
                  </Button>
                  <Button
                    className="mt-4"
                    variant="destructive"
                    onClick={handleRemoveUserFromShift}
                    disabled={!selectedShiftUser || isShiftCompleted}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t.removeFromShift}
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">{t.shiftStaff}</h3>
                    {selectedShiftUser && (
                      <span className="text-sm text-muted-foreground">
                        {t.selected}: 1
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 h-96 overflow-y-auto border rounded-lg p-2">
                    {staff && staff?.length > 0 ? (
                      staff.map(user => (
                        <div
                          key={user.userId}
                          className={`p-3 rounded-lg cursor-pointer  flex items-center gap-3 ${selectedShiftUser === user.userId
                            ? 'bg-destructive/10 border-2 border-destructive'
                            : 'hover:bg-accent'
                            }`}
                          onClick={() => setSelectedShiftUser(user.userId)}
                        >
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.user.email}</p>
                            <RoleBadge role={user.user.role} lang={language} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {t.noStaff}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>{t.orders}</CardTitle>
            </CardHeader>
            <CardContent>
              {shift.orders?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.orderId}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.amount}</TableHead>
                      <TableHead>{t.createdAt}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shift.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.number}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} lang={language} />
                        </TableCell>
                        <TableCell>{order.totalAmount?.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className='justify-end flex'>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t.noOrders}</p>
              )}
            </CardContent>
          </Card>



        </div>
      </div>
    </AccessCheck>
  );
}