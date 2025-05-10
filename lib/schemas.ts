import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export type AuthFormValues = z.infer<typeof authSchema>;