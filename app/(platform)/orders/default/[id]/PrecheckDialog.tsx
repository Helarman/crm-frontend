import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import { OrderResponse } from '@/lib/api/order.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { toast } from 'sonner';

interface PrecheckDialogProps {
  order: OrderResponse;
  onClose: () => void;
}

const PrecheckDialog = ({ order, onClose }: PrecheckDialogProps) => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasPrintedRef = useRef(false);

  const translations = {
    ru: {
      orderNumber: "Заказ №",
      orderType: "Тип заказа",
      createdAt: "Дата создания",
      product: "Продукт",
      quantity: "Кол-во",
      price: "Цена",
      total: "Итого",
      toPay: "К оплате",
      thanks: "Спасибо, ждем вас снова!",
      print: "Печать",
      printing: "Печать...",
      close: "Закрыть",
      printError: "Ошибка печати. Пожалуйста, попробуйте еще раз.",
      waiter: "Оф",
      orderTypes: {
        DINE_IN: "В заведении",
        TAKEAWAY: "На вынос",
        DELIVERY: "Доставка",
        BANQUET: "Банкет"
      },
      discount: "Скидка",
      bonusPoints: "Бонусные баллы",
      surcharges: "Надбавки"
    },
    ka: {
      orderNumber: "შეკვეთა №",
      orderType: "შეკვეთის ტიპი",
      createdAt: "შექმნის თარიღი",
      product: "პროდუქტი",
      quantity: "რაოდ.",
      price: "ფასი",
      total: "სულ",
      toPay: "გადასახდელი",
      thanks: "მადლობა, ისევ მოგვინახავთ!",
      print: "ბეჭდვა",
      printing: "ბეჭდვა...",
      close: "დახურვა",
      printError: "ბეჭდვის შეცდომა. გთხოვთ სცადოთ ხელახლა.",
      waiter: "მიმტანი",
      orderTypes: {
        DINE_IN: "დაწესებულებაში",
        TAKEAWAY: "წინასწარ",
        DELIVERY: "მიწოდება",
        BANQUET: ""
      },
      discount: "ფასდაკლება",
      bonusPoints: "ბონუს ქულები",
      surcharges: "მოდიფიკატორები"
    }
  };

  const t = translations[language];
  useEffect(() => {
    safeHandlePrint()
  }, []);

  const calculateItemPrice = (item: OrderResponse['items'][0]) => {
    if (item.isRefund) return 0;
    
    const restaurantPrice = item.product.restaurantPrices?.find(
      p => p.restaurantId === order?.restaurant?.id
    );
    const basePrice = restaurantPrice?.price ?? item.product.price;
    const additivesPrice = item.additives.reduce((sum, a) => sum + (a.price || 0), 0);
    return (basePrice + additivesPrice) * item.quantity;
  };

  const calculateTotal = () => {
    const itemsTotal = order.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);

    const surchargesTotal = order.surcharges?.reduce((sum, surcharge) => {
      if (surcharge.type === 'FIXED') {
        return sum + surcharge.amount;
      } else {
        return sum + (itemsTotal * surcharge.amount) / 100;
      }
    }, 0) || 0;

    let total = itemsTotal + surchargesTotal;

    if (order.discountAmount && order.discountAmount > 0) {
      total = Math.max(0, total - order.discountAmount);
    }

    if (order.bonusPointsUsed && order.bonusPointsUsed > 0) {
      total = Math.max(0, total - order.bonusPointsUsed);
    }

    return total;
  };

  const calculateSubtotal = () => {
    return order.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  };

  const formatDate = (dateString: Date) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPpp', {
        locale: language === 'ru' ? ru : ka
      });
    } catch (e) {
      console.error('Invalid date format', e);
      return '';
    }
  };

  const handlePrintError = () => {
    toast.error(t.printError);
    setIsPrinting(false);
  };

  const handlePrint = useReactToPrint({
    contentRef,
    onAfterPrint: () => setIsPrinting(false),
    onPrintError: handlePrintError,
    pageStyle: `
      @page { size: auto; margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-content { margin: 0 !important; padding: 0 !important; }
      }
    `
  });

  const fallbackPrint = () => {
    const printContent = contentRef.current?.innerHTML;
    if (!printContent) {
      handlePrintError();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      handlePrintError();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Хинкальная City</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { font-family: Arial, sans-serif; line-height: 1.5; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-lg { font-size: 1.125rem; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .mb-4 { margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            setTimeout(function() {
              window.print();
              window.close();
            }, 200);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const safeHandlePrint = async () => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    try {
      await handlePrint();
    } catch (error) {
      console.error('Print error:', error);
      fallbackPrint();
    }
  };

  useEffect(() => {
    if (!hasPrintedRef.current) {
      hasPrintedRef.current = true;
      const timer = setTimeout(() => {
        safeHandlePrint();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const getDomain = () => {
    return order.restaurant?.network?.tenant?.domain;
  };

  const nameParts = user?.name.split(' ');
  const firstName = nameParts[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Основной контейнер с фиксированной высотой */}
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md flex flex-col max-h-[95vh]">
        {/* Заголовок диалога */}
        <div className="p-6 border-b dark:border-gray-700 no-print flex-shrink-0">
          <h2 className="text-xl font-semibold text-center">
            {t.orderNumber}{order.number}
          </h2>
        </div>

        {/* Прокручиваемая область - ОСНОВНОЙ КОНТЕНТ */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={contentRef} className="print-content bg-white text-black">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Хинкальная CITY</h2>
              <p className="text-xs text-gray-600 mt-1">{order.restaurant?.legalInfo}</p>
            </div>

            {/* Информация о заказе */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{t.orderNumber}{order.number}</span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{`${t.waiter}. ${firstName}`}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{t.orderType}: {t.orderTypes[order.type]}</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* Список товаров */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left pb-2 text-sm font-medium">{t.product}</th>
                    <th className="text-center pb-2 text-sm font-medium">{t.quantity}</th>
                    <th className="text-right pb-2 text-sm font-medium">{t.price}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id} className={index < order.items.length - 1 ? 'border-b border-gray-200' : ''}>
                      <td className="py-3">
                        <div className="font-medium text-sm">{item.product.title}</div>
                        {item.additives.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.additives.map(a => a.title).join(', ')}
                          </div>
                        )}
                        {item.comment && (
                          <div className="text-xs text-gray-500 mt-1 italic">"{item.comment}"</div>
                        )}
                      </td>
                      <td className="text-center py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded-full">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="text-right py-3 text-sm font-medium">
                        {calculateItemPrice(item).toFixed(2)} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Дополнительные сборы */}
            {order.surcharges && order.surcharges.length > 0 && (
              <div className="border-t border-gray-300 pt-4 mb-4">
                <div className="text-sm font-medium mb-2">{t.surcharges}:</div>
                {order.surcharges.map((surcharge, index) => (
                  <div key={surcharge.id} className={`flex justify-between text-sm ${index < order.surcharges!.length - 1 ? 'mb-1' : ''}`}>
                    <span className="text-gray-600">{surcharge.title}</span>
                    <span className="font-medium">
                      {surcharge.type === 'FIXED' 
                        ? `+${surcharge.amount.toFixed(2)} ₽` 
                        : `+${surcharge.amount}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Скидки и бонусы */}
            <div className="space-y-2 mb-4">
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.discount}:</span>
                  <span className="text-red-600 font-medium">-{order.discountAmount.toFixed(2)} ₽</span>
                </div>
              )}

              {order.bonusPointsUsed && order.bonusPointsUsed > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.bonusPoints}:</span>
                  <span className="text-red-600 font-medium">-{order.bonusPointsUsed.toFixed(2)} ₽</span>
                </div>
              )}
            </div>

            {/* Итоги */}
            <div className="border-t border-gray-300 pt-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{t.total}:</span>
                <span className="font-medium">{calculateSubtotal().toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{t.toPay}:</span>
                <span className="text-green-600">{calculateTotal().toFixed(2)} ₽</span>
              </div>
            </div>

            {/* Благодарность и QR код */}
            <div className="text-center border-t border-gray-300 pt-6">
              <p className="text-lg mb-4 font-semibold">{t.thanks}</p>
              {getDomain() && (
                <>
                  <div className="text-lg mb-4 font-semibold text-blue-600">
                    {getDomain()}
                  </div>
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG 
                      value={getDomain() || ''}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="p-6 border-t dark:border-gray-700 no-print flex-shrink-0">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t.close}
            </Button>
            <Button onClick={safeHandlePrint} disabled={isPrinting}>
              {isPrinting ? t.printing : t.print}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrecheckDialog;