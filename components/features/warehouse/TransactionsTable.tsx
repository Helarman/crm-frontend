'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { InventoryTransactionType } from '@/lib/api/warehouse.service';

interface Transaction {
  id: string;
  type: InventoryTransactionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  createdAt: string;
  updatedAt: string;
  reason?: string;
  documentId?: string;
  inventoryItem: {
    id: string;
    name: string;
    unit: string;
  };
  warehouseItem?: {
    id: string;
    warehouse: {
      id: string;
      name: string;
    };
  };
  warehouse?: {
    id: string;
    name: string;
  };
  targetWarehouse?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TransactionsTableProps {
  transactions: Transaction[];
  showWarehouseInfo?: boolean;
}

export function TransactionsTable({ transactions, showWarehouseInfo = false }: TransactionsTableProps) {
  const getTransactionTypeTranslation = (type: InventoryTransactionType) => {
    const typeMap = {
      [InventoryTransactionType.RECEIPT]: 'Поступление',
      [InventoryTransactionType.WRITE_OFF]: 'Списание',
      [InventoryTransactionType.CORRECTION]: 'Корректировка',
      [InventoryTransactionType.TRANSFER]: 'Перемещение',
      [InventoryTransactionType.PREPARATION]: 'Подготовка',
      [InventoryTransactionType.USAGE]: 'Использование',
    };
    return typeMap[type] || type;
  };

  const getTransactionTypeVariant = (type: InventoryTransactionType) => {
    const variantMap = {
      [InventoryTransactionType.RECEIPT]: 'default',
      [InventoryTransactionType.WRITE_OFF]: 'destructive',
      [InventoryTransactionType.CORRECTION]: 'default',
      [InventoryTransactionType.TRANSFER]: 'default',
      [InventoryTransactionType.PREPARATION]: 'secondary',
      [InventoryTransactionType.USAGE]: 'outline',
    };
    return variantMap[type] || 'default';
  };

  const getQuantityChange = (transaction: Transaction) => {
    if (transaction.type === InventoryTransactionType.TRANSFER) {
      return `-${transaction.quantity}`;
    }
    return transaction.type === InventoryTransactionType.RECEIPT ? 
      `+${transaction.quantity}` : 
      `-${transaction.quantity}`;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет транзакций
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead className="w-64">Товар</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Изменение</TableHead>
            <TableHead>Было</TableHead>
            <TableHead>Стало</TableHead>
            <TableHead>Причина</TableHead>
            {showWarehouseInfo && (
              <>
                <TableHead>Склад</TableHead>
                <TableHead>Целевой склад</TableHead>
              </>
            )}
            <TableHead>Пользователь</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(transaction.createdAt), 'dd.MM.yyyy HH:mm')}
              </TableCell>
              
              <TableCell className="w-64">
                <div className="flex flex-col">
                  {transaction.inventoryItem ? (
                    <div className="font-medium text-base">{transaction.inventoryItem.name}</div>
                  ) : (
                    <div>N/A</div>
                  )}
                  {transaction.inventoryItem ? (
                    <div className="text-sm text-muted-foreground">{transaction.inventoryItem.unit}</div>
                  ) : (
                    <div>N/A</div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant={getTransactionTypeVariant(transaction.type) as any}>
                  {getTransactionTypeTranslation(transaction.type)}
                </Badge>
              </TableCell>
              
              <TableCell className={
                transaction.type === InventoryTransactionType.RECEIPT ? 
                'text-green-600 font-medium' : 
                'text-red-600 font-medium'
              }>
                {getQuantityChange(transaction)}
              </TableCell>
              
              <TableCell>
                {transaction.previousQuantity}
              </TableCell>
              
              <TableCell>
                {transaction.newQuantity}
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div className="line-clamp-2">
                  {transaction.reason || 'Без причины'}
                </div>
              </TableCell>

              {showWarehouseInfo && (
                <>
                  <TableCell>
                    {transaction.warehouse?.name || 
                     transaction.warehouseItem?.warehouse.name || 
                     'Неизвестный склад'}
                  </TableCell>
                  
                  <TableCell>
                    {transaction.targetWarehouse?.name || 
                     (transaction.type === InventoryTransactionType.TRANSFER ? 
                      'Неизвестный склад' : '-')}
                  </TableCell>
                </>
              )}
              
              <TableCell>
                {transaction.user?.name ? (
                  <div className="flex flex-col">
                    <span>{transaction.user.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {transaction.user.email}
                    </span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}