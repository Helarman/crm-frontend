'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomerDto, CustomerService } from '@/lib/api/customer.service';
import { Language } from '@/lib/stores/language-store';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Loading from '../Loading';

interface CustomerTableProps {
  customers: CustomerDto[];
  isLoading: boolean;
  language: string;
  onRefresh: () => void;
}

const translations = {
  phone: {
    ru: 'Телефон',
    ka: 'ტელეფონი',
  },
  bonusPoints: {
    ru: 'Бонусы',
    ka: 'ბონუსები',
  },
  createdAt: {
    ru: 'Дата регистрации',
    ka: 'რეგისტრაციის თარიღი',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  noCustomers: {
    ru: 'Клиенты не найдены',
    ka: 'კლიენტები ვერ მოიძებნა',
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...',
  },
  edit: {
    ru: 'Редактировать',
    ka: 'რედაქტირება',
  },
  delete: {
    ru: 'Удалить',
    ka: 'წაშლა',
  },
  addPoints: {
    ru: 'Добавить баллы',
    ka: 'ბონუსების დამატება',
  },
  setPoints: {
    ru: 'Установить баллы',
    ka: 'ბონუსების დაყენება',
  }
};

export const CustomerTable = ({
  customers,
  isLoading,
  language,
  onRefresh,
}: CustomerTableProps) => {
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdatePoints = async (customerId: string) => {
    if (!pointsInput) return;
    
    try {
      setIsProcessing(true);
      await CustomerService.updateBonusPoints(customerId, Number(pointsInput));
      toast(language === 'ru' ? 'Бонусные баллы обновлены' : 'ბონუსები განახლდა',)
      setEditingCustomer(null);
      onRefresh();
    } catch (error) {
        toast(language === 'ru' ? 'Не удалось обновить баллы' : 'ბონუსების განახლება ვერ მოხერხდა',)
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPoints = async (customerId: string, points: number) => {
    try {
      setIsProcessing(true);
      await CustomerService.incrementBonusPoints(customerId, points);
      onRefresh();
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.phone[language as Language]}</TableHead>
            <TableHead>{translations.bonusPoints[language as Language]}</TableHead>
            <TableHead>{translations.createdAt[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <Loading/>
              </TableCell>
            </TableRow>
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.noCustomers[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={`customer-${customer.id}`}>
                <TableCell className="font-medium">{customer.phone}</TableCell>
                
                <TableCell>
                  {editingCustomer === customer.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={pointsInput}
                        onChange={(e) => setPointsInput(e.target.value)}
                        className="w-24"
                        placeholder="Баллы"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePoints(customer.id)}
                        disabled={isProcessing}
                      >
                        {translations.setPoints[language as Language]}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary">
                      {customer.bonusPoints || 0} {language === 'ru' ? 'бонусов' : 'ბონუსი'}
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell>
                  {customer.createdAt && new Date(customer.createdAt).toLocaleDateString()}
                </TableCell>
                
                <TableCell className="text-right space-x-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCustomer(customer.id)}
                      disabled={isProcessing}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddPoints(customer.id, 10)}
                      disabled={isProcessing}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddPoints(customer.id, -10)}
                      disabled={isProcessing}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};