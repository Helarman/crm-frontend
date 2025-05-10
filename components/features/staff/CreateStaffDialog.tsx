import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useLanguageStore } from '@/lib/stores/language-store'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { UserService } from '@/lib/api/user.service'
import { toast } from 'sonner'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const translations = {
  ru: {
    createUser: "Создать пользователя",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    create: "Создать",
    cancel: "Отмена",
    nameRequired: "Имя обязательно",
    emailRequired: "Email обязателен",
    invalidEmail: "Некорректный email",
    passwordRequired: "Пароль обязателен",
    minPasswordLength: "Пароль должен содержать минимум 6 символов",
    emailTaken: "Email уже занят",
    checkingEmail: "Проверка email...",
    userCreated: "Пользователь успешно создан",
    error: "Ошибка при создании пользователя"
  },
  ka: {
    createUser: "მომხმარებლის შექმნა",
    name: "სახელი",
    email: "ელ. ფოსტა",
    password: "პაროლი",
    create: "შექმნა",
    cancel: "გაუქმება",
    nameRequired: "სახელი სავალდებულოა",
    emailRequired: "ელ. ფოსტა სავალდებულოა",
    invalidEmail: "არასწორი ელ. ფოსტა",
    passwordRequired: "პაროლი სავალდებულოა",
    minPasswordLength: "პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან",
    emailTaken: "ელ. ფოსტა უკვე დაკავებულია",
    checkingEmail: "ელ. ფოსტის შემოწმება...",
    userCreated: "მომხმარებელი წარმატებით შეიქმნა",
    error: "მომხმარებლის შექმნის შეცდომა"
  }
}

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).email(),
  password: z.string().min(6),
})

export function CreateStaffDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const { language } = useLanguageStore()
  const t = translations[language]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    }
  })

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    try {
      setIsSubmitting(true)
      
      const isUserExist = await UserService.getByEmail(values.email)
      if (isUserExist) {
        toast.error('Email занят')
        setEmailError('Email занят')
        return
      }

     await UserService.register(values)
      form.reset()
      onOpenChange(false)
      toast.success(t.userCreated)
      onSuccess?.()
    } catch (error) {
      toast.error(t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset()
        setEmailError(null)
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.createUser}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.name && t.nameRequired}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.email}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.email?.type === 'required' && t.emailRequired}
                    {form.formState.errors.email?.type === 'invalid_string' && t.invalidEmail}
                    {emailError === 'emailTaken' && t.emailTaken}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.password}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.password?.type === 'required' && t.passwordRequired}
                    {form.formState.errors.password?.type === 'too_small' && t.minPasswordLength}
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.create
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}