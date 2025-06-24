import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useReactToPrint } from 'react-to-print';
import { OrderResponse } from '@/lib/api/order.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { toast } from 'sonner'; // or your preferred toast library

interface PrecheckDialogProps {
  order: OrderResponse;
  onClose: () => void;
}

const PrecheckDialog = ({ order, onClose }: PrecheckDialogProps) => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
        DELIVERY: "Доставка"
      }
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
        DELIVERY: "მიწოდება"
      }
    }
  };

  const t = translations[language];

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
        body { -webkit-print-color-adjust: exact; width: 50% }
        .no-print { display: none !important; }
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
          <title>'Хинкальная City'}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { width: 50%; font-family: Arial, sans-serif; line-height: 1.5; }
            table { width: 50%; border-collapse: collapse; }
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
    try {
      await handlePrint();
    } catch (error) {
      console.error('Print error:', error);
      fallbackPrint();
    }
  };

  const getDomain = () => {
    return order.restaurant?.network?.tenant?.domain
  };
const nameParts = user?.name.split(' ')
const firstName = nameParts[0];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div ref={contentRef} className="p-4 bg-white text-black print:p-0 print:bg-white">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Хинкальная CITY</h2>
            <p className="text-xs">{order.restaurant?.legalInfo}</p>
          </div>

          <div className="border-b border-dashed border-gray-400 pb-2 mb-4">
            <div className="flex justify-between">
              <span className="font-medium">{t.orderNumber}{order.number}</span>
              <span>{`${t.waiter}. ${firstName}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.orderType}: {t.orderTypes[order.type]}</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>

          <div className="mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left pb-1">{t.product}</th>
                  <th className="text-center pb-1">{t.quantity}</th>
                  <th className="text-right pb-1">{t.price}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-1">
                      {item.product.title}
                      {item.additives.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {item.additives.map(a => a.title).join(', ')}
                        </div>
                      )}
                      {item.comment && (
                        <div className="text-xs text-gray-500">{item.comment}</div>
                      )}
                    </td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">{calculateItemPrice(item).toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-300 pt-2 mb-4">
            <div className="flex justify-between font-medium">
              <span>{t.total}:</span>
              <span>{calculateTotal().toFixed(2)} ₽</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t.toPay}:</span>
              <span>{calculateTotal().toFixed(2)} ₽</span>
            </div>
          </div>

          <div className="text-center text-xl mb-4">
            <p>{t.thanks}</p>
          </div>
            <div className="text-center text-xl mb-4 font-semibold">
            {getDomain()}
          </div>
          <div className="flex justify-center mb-4">
            <QRCodeSVG 
              value={getDomain()}
              size={240}
              level="H" // Higher error correction
            />
          </div>

          
        </div>

        <div className="flex justify-end gap-2 mt-4 no-print">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
          <Button onClick={safeHandlePrint} disabled={isPrinting}>
            {isPrinting ? t.printing : t.print}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrecheckDialog;