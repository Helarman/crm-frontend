"use client"

import Nav from "@/components/features/navbar/Nav";
import Side from "@/components/features/navbar/Side";

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    
    return (
        <div className="flex h-screen ">
        <Side/>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Nav/>
          <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-700">
            {children}
          </main>
        </div>
        </div>
    );
  }

