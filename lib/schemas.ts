import { z } from 'zod'

export const authSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
    .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Пароль должен содержать хотя бы один специальный символ'),
  confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Вы должны согласиться с условиями',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type AuthFormValues = z.infer<typeof authSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>