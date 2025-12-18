// app/(platform)/print/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AutoPrint() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState('Автоматическая печать документа');

  useEffect(() => {
    // Получаем параметры из URL
    const urlContent = searchParams.get('content');
    if (urlContent) {
      setContent(decodeURIComponent(urlContent));
    }
  }, [searchParams]);

  useEffect(() => {
    const handlePrint = () => {
      window.print();
    };

    // Задержка для загрузки страницы
    const printTimer = setTimeout(handlePrint, 1000);

    // Обработчик после печати
    const handleAfterPrint = () => {
      setTimeout(() => {
        // Закрываем окно если это popup, или возвращаемся назад
        if (window.opener) {
          window.close();
        } else if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/print-test');
        }
      }, 500);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(printTimer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>Автоматическая печать</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      
      <div className="print-document">
        <h1>Автоматическая печать</h1>
        <p>Этот документ должен автоматически отправиться на печать...</p>
        <div className="content">
          {content}
        </div>
        <footer>
          <p>Сгенерировано: {new Date().toLocaleString()}</p>
          <p>Если печать не началась автоматически, нажмите Ctrl+P</p>
        </footer>
      </div>

      <style jsx>{`
        .print-document {
          padding: 40px;
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
        }
        
        h1 {
          color: #333;
          border-bottom: 2px solid #0070f3;
          padding-bottom: 10px;
        }
        
        .content {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ddd;
          background: #f9f9f9;
          border-radius: 4px;
          white-space: pre-wrap;
        }
        
        footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          .print-document {
            padding: 0;
            margin: 0;
          }
          footer p:last-child {
            display: none;
          }
        }
      `}</style>
    </>
  );
}