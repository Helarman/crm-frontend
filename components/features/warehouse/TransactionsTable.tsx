'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { transactionsTranslations } from './translations';
import { useLanguageStore } from '@/lib/stores/language-store';

interface Transaction {
  id: string;
  type: 'RECEIPT' | 'WRITE_OFF';
  quantity: number;
  createdAt: string;
  inventoryItem: {
    name: string
  }
  user?: {
    name: string;
  };
  reason?: string;
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const { language } = useLanguageStore();
  
  const t = (key: keyof typeof transactionsTranslations) => {
    return transactionsTranslations[key]?.[language] || key;
  };

  const getTransactionTypeTranslation = (type: string) => {
    switch(type) {
      case 'RECEIPT':
        return transactionsTranslations.receipt[language];
      case 'WRITE_OFF':
        return transactionsTranslations.writeOff[language];
      default:
        return type;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('type')}</TableHead>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('quantity')}</TableHead>
          <TableHead>{t('date')}</TableHead>
          <TableHead>{t('user')}</TableHead>
          <TableHead>{t('reason')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>
              <Badge variant={tx.type === 'RECEIPT' ? 'default' : 'destructive'}>
                
                {getTransactionTypeTranslation(tx.type)}
              </Badge>
            </TableCell>
            <TableCell>{tx.inventoryItem?.name}</TableCell>
            <TableCell>{tx.quantity}</TableCell>
            <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
            <TableCell>{tx.user?.name || '-'}</TableCell>
            <TableCell>{tx.reason || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}