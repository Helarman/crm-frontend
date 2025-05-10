'use client'
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthInitializer } from "@/components/features/auth/AuthInitializer";
import { Toaster } from "@/components/ui/sonner"
const inter = Inter({ subsets: ["latin"] });
import { ThemeProvider } from "@/components/theme-provider"
import { useTitle } from '@/lib/hooks/useTitle'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useTitle('CRM')
  return (
    <html suppressHydrationWarning> 
      <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthInitializer>
              <Toaster position="top-center" richColors />
              <div className="w-full bg-white dark:bg-gray-900">
                {children}
              </div>
            </AuthInitializer>

          </ThemeProvider>
      </body>
    </html>
  );
}