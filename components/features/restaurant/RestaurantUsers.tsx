import { useRestaurantUsers } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

export function RestaurantUsers() {
  const params = useParams();
  const restaurantId = params.id;
  const { data: users, mutate } = useRestaurantUsers(restaurantId as string);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      title: "Команда ресторана",
      emailPlaceholder: "Email нового участника",
      addButton: "Добавить",
      adding: "Добавление...",
      addSuccess: "Участник успешно добавлен",
      addError: "Не удалось добавить участника",
      emptyEmailError: "Введите email участника",
      removeSuccess: "Участник удалён из команды",
      removeError: "Не удалось удалить участника",
      noName: "Без имени",
      name: "Имя",
      email: "Email",
      role: "Роль",
      actions: "",
      removeButton: "Удалить",
      roles: {
        NONE: "Без роли",
        STOREMAN: "Кладовщик",
        COURIER: "Курьер",
        COOK: "Повар",
        CHEF: "Шеф-повар",
        WAITER: "Официант",
        CASHIER: "Кассир",
        MANAGER: "Менеджер",
        SUPERVISOR: "Супервайзер"
      },
      roleColors: {
        NONE: "bg-gray-100 text-gray-800",
        STOREMAN: "bg-blue-100 text-blue-800",
        COURIER: "bg-green-100 text-green-800",
        COOK: "bg-yellow-100 text-yellow-800",
        CHEF: "bg-orange-100 text-orange-800",
        WAITER: "bg-purple-100 text-purple-800",
        CASHIER: "bg-pink-100 text-pink-800",
        MANAGER: "bg-red-100 text-red-800",
        SUPERVISOR: "bg-indigo-100 text-indigo-800"
      }
    },
    ka: {
      title: "რესტორანის გუნდი",
      emailPlaceholder: "ახალი წევრის ელ. ფოსტა",
      addButton: "დამატება",
      adding: "დამატება...",
      addSuccess: "წევრი წარმატებით დაემატა",
      addError: "წევრის დამატება ვერ მოხერხდა",
      emptyEmailError: "შეიყვანეთ წევრის ელ. ფოსტა",
      removeSuccess: "წევრი წაიშალა გუნდიდან",
      removeError: "წევრის წაშლა ვერ მოხერხდა",
      noName: "უსახელო",
      name: "სახელი",
      email: "Email",
      role: "როლი",
      actions: "",
      removeButton: "წაშლა",
      roles: {
        NONE: "როლის გარეშე",
        STOREMAN: "საწყობის მენეჯერი",
        COURIER: "კურიერი",
        COOK: "მზარეული",
        CHEF: "შეფ-მზარეული",
        WAITER: "ოფიციანტი",
        CASHIER: "კასირი",
        MANAGER: "მენეჯერი",
        SUPERVISOR: "ადმინისტრატორი"
      },
      roleColors: {
        NONE: "bg-gray-100 text-gray-800",
        STOREMAN: "bg-blue-100 text-blue-800",
        COURIER: "bg-green-100 text-green-800",
        COOK: "bg-yellow-100 text-yellow-800",
        CHEF: "bg-orange-100 text-orange-800",
        WAITER: "bg-purple-100 text-purple-800",
        CASHIER: "bg-pink-100 text-pink-800",
        MANAGER: "bg-red-100 text-red-800",
        SUPERVISOR: "bg-indigo-100 text-indigo-800"
      }
    }
  } as const;

  const t = translations[language];

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error(t.emptyEmailError);
      return;
    }

    setIsLoading(true);
    try {
      await RestaurantService.addUserByEmail(restaurantId as string, {
        email: newUserEmail
      });
      mutate();
      setNewUserEmail('');
      toast.success(t.addSuccess);
    } catch (err) {
      console.error('Failed to add user', err);
      toast.error(t.addError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await RestaurantService.removeUser(restaurantId as string, userId);
      mutate();
      toast.success(t.removeSuccess);
    } catch (err) {
      console.error('Failed to remove user', err);
      toast.error(t.removeError);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return t.noName[0];
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t.title}</h2>

      <div className="flex gap-2">
        <Input
          type="email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="flex-1"
        />
        <Button
          onClick={handleAddUser}
          disabled={isLoading || !newUserEmail.trim()}
        >
          {isLoading ? t.adding : t.addButton}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.role}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name || t.noName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={t.roleColors[user.role as keyof typeof t.roleColors]}>
                    {t.roles[user.role as keyof typeof t.roles]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(user.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    {t.removeButton}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}