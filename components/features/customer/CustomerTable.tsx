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
import { Pencil, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomerDto } from '@/lib/api/customer.service';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Loading from '../Loading';
import { CustomerService } from '@/lib/api/customer.service';

interface CustomerTableProps {
  customers: CustomerDto[];
  isLoading: boolean;
  language: 'ru' | 'ka';
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
  personalDiscount: {
    ru: 'Скидка',
    ka: 'ფასდაკლება',
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
  setPoints: {
    ru: 'Установить',
    ka: 'დაყენება',
  },
  setDiscount: {
    ru: 'Установить',
    ka: 'დაყენება',
  },
  percent: {
    ru: '%',
    ka: '%',
  },
  pointsUpdated: {
    ru: 'Баллы обновлены',
    ka: 'ბონუსები განახლდა',
  },
  discountUpdated: {
    ru: 'Скидка обновлена',
    ka: 'ფასდაკლება განახლდა',
  },
  updateFailed: {
    ru: 'Ошибка обновления',
    ka: 'განახლების შეცდომა',
  }
};

export function CustomerTable({
  customers,
  isLoading,
  language,
  onRefresh,
}: CustomerTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'points' | 'discount' | null>(null);
  const [pointsInput, setPointsInput] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdatePoints = async (customerId: string) => {
    if (!pointsInput) return;
    
    try {
      setIsProcessing(true);
      await CustomerService.updateBonusPoints(customerId, Number(pointsInput));
      toast.success(translations.pointsUpdated[language]);
      setEditingId(null);
      setEditingType(null);
      onRefresh();
    } catch (error) {
      toast.error(translations.updateFailed[language]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDiscount = async (customerId: string) => {
    if (!discountInput) return;
    
    try {
      setIsProcessing(true);
      await CustomerService.updatePersonalDiscount(
        customerId, 
        Math.min(100, Math.max(0, Number(discountInput)))
      );
      toast.success(translations.discountUpdated[language]);
      setEditingId(null);
      setEditingType(null);
      onRefresh();
    } catch (error) {
      toast.error(translations.updateFailed[language]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIncrementPoints = async (customerId: string, points: number) => {
    try {
      setIsProcessing(true);
      await CustomerService.incrementBonusPoints(customerId, points);
      onRefresh();
    } catch (error) {
      toast.error(translations.updateFailed[language]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIncrementDiscount = async (customerId: string, increment: number) => {
    try {
      setIsProcessing(true);
      await CustomerService.incrementPersonalDiscount(customerId, increment);
      onRefresh();
    } catch (error) {
      toast.error(translations.updateFailed[language]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.phone[language]}</TableHead>
            <TableHead>{translations.bonusPoints[language]}</TableHead>
            <TableHead>{translations.personalDiscount[language]}</TableHead>
            <TableHead>{translations.createdAt[language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <Loading/>
              </TableCell>
            </TableRow>
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {translations.noCustomers[language]}
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={`customer-${customer.id}`}>
                <TableCell className="font-medium">{customer.phone}</TableCell>
                
                {/* Бонусные баллы */}
                <TableCell>
                  {editingId === customer.id && editingType === 'points' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={pointsInput}
                        onChange={(e) => setPointsInput(e.target.value)}
                        className="w-24"
                        placeholder="0"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePoints(customer.id)}
                        disabled={isProcessing}
                      >
                        {translations.setPoints[language]}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                    <Badge variant="outline" className='w-16 text-cente'>
                      {customer.bonusPoints || 0}
                    </Badge>
                     <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(customer.id);
                        setEditingType('points');
                        setPointsInput(String(customer.bonusPoints || 0));
                      }}
                      disabled={isProcessing}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    </div>
                  )}
                </TableCell>
                
                {/* Персональная скидка */}
                <TableCell>
                  {editingId === customer.id && editingType === 'discount' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-24"
                        placeholder="0-100"
                        min="0"
                        max="100"
                      />
                      <span>{translations.percent[language]}</span>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateDiscount(customer.id)}
                        disabled={isProcessing}
                      >
                        {translations.setDiscount[language]}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className='w-16 text-center'>
                        {customer.personalDiscount || 0}{translations.percent[language]}
                      </Badge>
                          <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(customer.id);
                          setEditingType('discount');
                          setDiscountInput(String(customer.personalDiscount || 0));
                        }}
                        disabled={isProcessing}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  {customer.createdAt && new Date(customer.createdAt).toLocaleDateString()}
                </TableCell>
                
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}