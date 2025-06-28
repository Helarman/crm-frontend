'use client'

import { useState, useEffect } from 'react';
import { CustomerTable } from '@/components/features/customer/CustomerTable';
import { CustomerDto } from '@/lib/api/customer.service';
import { Language, useLanguageStore } from '@/lib/stores/language-store';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CustomerService } from '@/lib/api/customer.service';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { language } = useLanguageStore();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await CustomerService.getAllCustomers(page, limit);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, limit]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {language === 'ru' ? 'Клиенты' : 'კლიენტები'}
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ru' ? 'Добавить клиента' : 'კლიენტის დამატება'}
        </Button>
      </div>

      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        language={language}
        onRefresh={fetchCustomers}
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          {language === 'ru' ? 'Назад' : 'უკან'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={customers.length < limit}
        >
          {language === 'ru' ? 'Вперед' : 'წინ'}
        </Button>
      </div>
    </div>
  );
}