'use client'

import { AuthForm } from "@/components/features/auth/AuthForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function LoginPage() {
  const { theme } = useTheme()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-center dark:text-gray-100">
            Вход в систему
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuthForm isLogin />
        </CardContent>
      </Card>
    </div>
  )
}