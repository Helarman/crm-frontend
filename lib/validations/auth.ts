import { z } from 'zod';

export const AuthSchema = z.object({
  email: z.string()
    .min(1, { message: "Поле обязательно для заполнения" })
    .email({ message: "Введите корректный email" })
    .max(100, { message: "Email слишком длинный" }),
  password: z.string()
    .min(6, { message: "Минимум 6 символов" })
    .max(50, { message: "Максимум 50 символов" })
    //.regex(/[A-Z]/, { message: "Хотя бы одна заглавная буква" })
    //.regex(/[0-9]/, { message: "Хотя бы одна цифра" })
});

export type AuthFormValues = z.infer<typeof AuthSchema>;

// Типы серверных ошибок
export type ServerError = {
  field?: keyof AuthFormValues;
  message: string;
  type: 'error' | 'warning';
};