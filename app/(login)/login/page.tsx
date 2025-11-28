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
    <div>
          <AuthForm/>
    </div>
  )
}