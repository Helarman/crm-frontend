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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useLanguageStore } from '@/lib/stores/language-store'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { UserService } from '@/lib/api/user.service'
import { toast } from 'sonner'
import SearchableSelect from '../menu/product/SearchableSelect'
import { Restaurant } from '@/lib/types/restaurant'
import { RestaurantService } from '@/lib/api/restaurant.service'

enum UserRoles {
  NONE = "NONE",
  STOREMAN = "STOREMAN",
  COURIER = "COURIER",
  COOK = "COOK",
  CHEF = "CHEF",
  WAITER = "WAITER",
  CASHIER = "CASHIER",
  MANAGER = "MANAGER",
  SUPERVISOR = "SUPERVISOR"
}

interface CreateStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultRestaurantId?: string
  restaurants?: Restaurant[]
}

const translations = {
  ru: {
    createUser: "Создать сотрудника",
    name: "Имя",
    email: "Email",
    phone: "Телефон",
    password: "Пароль",
    role: "Роль",
    selectRole: "Выберите роль",
    restaurants: "Рестораны",
    selectRestaurant: "Выберите ресторан",
    searchRestaurants: "Поиск ресторанов...",
    noRestaurants: "Рестораны не найдены",
    create: "Создать",
    cancel: "Отмена",
    nameRequired: "Имя обязательно",
    emailRequired: "Email обязателен",
    invalidEmail: "Некорректный email",
    phoneRequired: "Телефон обязателен",
    invalidPhone: "Некорректный номер телефона",
    passwordRequired: "Пароль обязателен",
    minPasswordLength: "Пароль должен содержать минимум 6 символов",
    roleRequired: "Роль обязательна",
    restaurantRequired: "Выберите ресторан",
    emailTaken: "Email уже занят",
    checkingEmail: "Проверка email...",
    userCreated: "Сотрудник успешно создан",
    error: "Ошибка при создании сотрудника",
    [UserRoles.NONE]: "Без роли",
    [UserRoles.STOREMAN]: "Кладовщик",
    [UserRoles.COURIER]: "Курьер",
    [UserRoles.COOK]: "Повар",
    [UserRoles.CHEF]: "Шеф-повар",
    [UserRoles.WAITER]: "Официант",
    [UserRoles.CASHIER]: "Кассир",
    [UserRoles.MANAGER]: "Менеджер",
    [UserRoles.SUPERVISOR]: "Супервайзер"
  },
  ka: {
    createUser: "თანამშრომლის შექმნა",
    name: "სახელი",
    email: "ელ. ფოსტა",
    phone: "ტელეფონი",
    password: "პაროლი",
    role: "როლი",
    selectRole: "აირჩიეთ როლი",
    restaurants: "რესტორანები",
    selectRestaurant: "აირჩიეთ რესტორანი",
    searchRestaurants: "რესტორანების ძებნა...",
    noRestaurants: "რესტორანები ვერ მოიძებნა",
    create: "შექმნა",
    cancel: "გაუქმება",
    nameRequired: "სახელი სავალდებულოა",
    emailRequired: "ელ. ფოსტა სავალდებულოა",
    invalidEmail: "არასწორი ელ. ფოსტა",
    phoneRequired: "ტელეფონი სავალდებულოა",
    invalidPhone: "არასწორი ტელეფონის ნომერი",
    passwordRequired: "პაროლი სავალდებულოა",
    minPasswordLength: "პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან",
    roleRequired: "როლი სავალდებულოა",
    restaurantRequired: "აირჩიეთ რესტორანი",
    emailTaken: "ელ. ფოსტა უკვე დაკავებულია",
    checkingEmail: "ელ. ფოსტის შემოწმება...",
    userCreated: "თანამშრომელი წარმატებით შეიქმნა",
    error: "თანამშრომლის შექმნის შეცდომა",
    [UserRoles.NONE]: "როლის გარეშე",
    [UserRoles.STOREMAN]: "საწყობის მენეჯერი",
    [UserRoles.COURIER]: "კურიერი",
    [UserRoles.COOK]: "მზარეული",
    [UserRoles.CHEF]: "შეფ-მზარეული",
    [UserRoles.WAITER]: "ოფიციანტი",
    [UserRoles.CASHIER]: "კასირი",
    [UserRoles.MANAGER]: "მენეჯერი",
    [UserRoles.SUPERVISOR]: "სუპერვაიზერი"
  }
}

// Функция для форматирования номера телефона
const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  let number = cleaned;
  if (cleaned.startsWith('8')) {
    number = '7' + cleaned.slice(1);
  } else if (!cleaned.startsWith('7') && cleaned.length > 0) {
    number = '7' + cleaned;
  }
  
  if (number.length <= 1) return '+7';
  if (number.length <= 4) return `+7 (${number.slice(1, 4)}`;
  if (number.length <= 7) return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}`;
  if (number.length <= 9) return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7, 9)}`;
  return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7, 9)}-${number.slice(9, 11)}`;
};

// Функция для валидации телефона
const validatePhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 11; // +7 XXX XXX XX XX = 11 цифр
};

// Обновляем схему валидации с добавлением поля phone
const createUserSchema = z.object({
  name: z.string().min(1, { message: "nameRequired" }),
  email: z.string().min(1, { message: "emailRequired" }).email({ message: "invalidEmail" }),
  phone: z.string()
    .min(1, { message: "phoneRequired" })
    .refine(validatePhone, { message: "invalidPhone" }),
  password: z.string().min(6, { message: "minPasswordLength" }),
  role: z.nativeEnum(UserRoles, { required_error: "roleRequired" }),
  restaurantId: z.string().min(1, { message: "restaurantRequired" }),
})

export function CreateStaffDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultRestaurantId,
  restaurants
}: CreateStaffDialogProps) {
  const { language } = useLanguageStore()
  const t = translations[language]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: UserRoles.NONE,
      restaurantId: defaultRestaurantId,
    }
  })

  const allRoles = Object.values(UserRoles)

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    try {
      setIsSubmitting(true)
      setEmailError(null)
      
      const isUserExist = await UserService.getByEmail(values.email)
      if (isUserExist) {
        setEmailError('emailTaken')
        toast.error(t.emailTaken)
        return
      }

      const newUser = await UserService.register({
        name: values.name,
        email: values.email,
        phone: values.phone, // Добавляем телефон
        password: values.password,
        role: values.role,
        acceptTerms: true
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      if (values.restaurantId) {
        RestaurantService.addUserByEmail(values.restaurantId, { email: values.email })
      }

      form.reset()
      onOpenChange(false)
      toast.success(t.userCreated)
      await new Promise(resolve => setTimeout(resolve, 2000))
      onSuccess()
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error(t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Обработчик изменения телефона с форматированием
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const formatted = formatPhoneNumber(e.target.value);
    field.onChange(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: UserRoles.NONE,
          restaurantId: defaultRestaurantId || '',
        })
        setEmailError(null)
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[500px]">
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
                  <FormMessage />
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
                      onChange={(e) => {
                        field.onChange(e)
                        setEmailError(null)
                      }}
                    />
                  </FormControl>
                  <FormMessage>
                    {emailError === 'emailTaken' && t.emailTaken}
                  </FormMessage>
                </FormItem>
              )}
            />

            {/* Новое поле для телефона */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.phone}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+7 (999) 999-99-99"
                      onChange={(e) => handlePhoneChange(e, field)}
                      maxLength={18}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.role}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectRole} />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoles.map((role) => (
                          <SelectItem 
                            key={role} 
                            value={role}
                            className="text-sm"
                          >
                            {t[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {restaurants && restaurants.length > 0 && (
              <FormField
                control={form.control}
                name="restaurantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.restaurants}</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                        value={field.value as any}
                        onChange={field.onChange}
                        placeholder={t.selectRestaurant} 
                        searchPlaceholder={t.searchRestaurants}
                        emptyText={t.noRestaurants}
                        multiple={false} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex justify-end gap-2 pt-4">
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