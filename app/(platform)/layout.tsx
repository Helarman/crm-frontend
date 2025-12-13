"use client"

import Nav from "@/components/features/navbar/Nav"

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    
    return (
        <div className="flex h-screen ">
          
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Nav/>
            <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-700">
              {children}
            </main>
        </div>
        </div>
    );
  }

