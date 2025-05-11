'use client';

import { useShift, useShiftUsers } from '@/lib/hooks/useShifts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, DollarSign, Users, User } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { AccessCheck } from '@/components/AccessCheck';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ShiftService } from '@/lib/api/shift.service';
import { toast } from 'sonner';

const translations = {
  ru: {
    shiftStats: 'Статистика смены',
    orders: 'Заказы',
    staff: 'Персонал',
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
    totalOrders: 'Всего заказов',
    totalAmount: 'Общая сумма',
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
    addStaff: 'Добавить персонал',
    emailPlaceholder: 'Введите email пользователя',
    add: 'Добавить',
    adding: 'Добавление...',
    success: 'Успех',
    userAddedSuccessfully: 'Пользователь успешно добавлен в смену',
    error: 'Ошибка',
    somethingWentWrong: 'Что-то пошло не так'
  },
  ka: {
    shiftStats: 'ცვლის სტატისტიკა',
    orders: 'შეკვეთები',
    staff: 'პერსონალი',
    orderId: 'შეკვეთის ID',
    status: 'სტატუსი',
    amount: 'თანხა',
    createdAt: 'შექმნის თარიღი',
    user: 'მომხმარებელი',
    role: 'როლი',
    back: 'უკან',
    loading: 'იტვირთება...',
    noOrders: 'შეკვეთები არ მოიძებნა',
    noStaff: 'პერსონალი არ არის მინიჭებული',
    totalOrders: 'შეკვეთების რაოდენობა',
    totalAmount: 'საერთო თანხა',
    staffCount: 'პერსონალის რაოდენობა',
    created: 'შექმნილი',
    confirmed: 'დადასტურებული',
    preparing: 'მზადდება',
    ready: 'მზადაა',
    delivering: 'იგზავნება',
    completed: 'დასრულებული',
    cancelled: 'გაუქმებული',
    admin: 'ადმინისტრატორი',
    manager: 'მენეჯერი',
    waiter: 'ოფიციანტი',
    chef: 'მზარეული',
    addStaff: 'პერსონალის დამატება',
    emailPlaceholder: 'შეიყვანეთ მომხმარებლის ელ.ფოსტა',
    add: 'დამატება',
    adding: 'დამატება...',
    success: 'წარმატება',
    userAddedSuccessfully: 'მომხმარებელი წარმატებით დაემატა ცვლაში',
    error: 'შეცდომა',
    somethingWentWrong: 'რაღაც შეცდომა მოხდა'
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

export default function ShiftStatsPage() {
  const { id } = useParams();
  const { language } = useLanguageStore();
  const t = translations[language];

  const { data: shift, isLoading: isLoadingShift, mutate: mutateShift } = useShift(id as string);
  const { data: staff, isLoading: isLoadingStaff, mutate: mutateStaff } = useShiftUsers(id as string);

  const [email, setEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);



  const handleAddUser = async () => {
    if (!email) return;

    setIsAddingUser(true);
    try {
      await ShiftService.addUserToShiftByEmail(id as string, { email });
      toast.success(t.userAddedSuccessfully);
      mutateShift();
      mutateStaff();
      setEmail('');
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.somethingWentWrong
      );
    } finally {
      setIsAddingUser(false);
    }
  };

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

  const totalAmount = shift.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;

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

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalOrders}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shift.orders?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.totalAmount}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.staffCount}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t.noOrders}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t.staff}</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      {t.addStaff}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addStaff}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Button
                        onClick={handleAddUser}
                        disabled={isAddingUser || !email}
                        className="w-full"
                      >
                        {isAddingUser ? t.adding : t.add}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : staff?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.user}</TableHead>
                      <TableHead>{t.role}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {user.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.user.role} lang={language} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t.noStaff}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AccessCheck>
  );
}