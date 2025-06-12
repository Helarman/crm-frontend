'use client'

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguageStore } from "@/lib/stores/language-store";
import { useAuth } from '@/lib/hooks/useAuth';
import { HexColorPicker } from "react-colorful";

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Invalid color format',
  }),
});

interface CreateNetworkFormProps {
  onSubmit: (values: z.infer<typeof formSchema> & { ownerId: string }) => void;
  onCancel: () => void;
}

export function CreateNetworkForm({ onSubmit, onCancel }: CreateNetworkFormProps) {
  const { language } = useLanguageStore();
  const { user } = useAuth();

  const translations = {
    ru: {
      name: "Название сети",
      description: "Описание",
      primaryColor: "Основной цвет",
      cancel: "Отмена",
      create: "Создать",
      required: "Обязательное поле",
      nameError: "Название должно содержать минимум 2 символа",
      colorError: "Неверный формат цвета (должен быть HEX, например #FFFFFF)",
    },
    ka: {
      name: "ქსელის სახელი",
      description: "აღწერა",
      primaryColor: "ძირითადი ფერი",
      cancel: "გაუქმება",
      create: "შექმნა",
      required: "აუცილებელი ველი",
      nameError: "სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან",
      colorError: "ფერის არასწორი ფორმატი (უნდა იყოს HEX, მაგალითად #FFFFFF)",
    }
  } as const;

  const t = translations[language];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      primaryColor: '#3b82f6', // default blue color
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return;
    onSubmit({ ...values, ownerId: user.id });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.name}</FormLabel>
              <FormControl>
                <Input placeholder={t.name} {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.name?.message === 'Name must be at least 2 characters.'
                  ? t.nameError
                  : form.formState.errors.name?.message}
              </FormMessage>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.description}</FormLabel>
              <FormControl>
                <Textarea placeholder={t.description} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.primaryColor}</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <HexColorPicker 
                    color={field.value} 
                    onChange={field.onChange} 
                    className="w-full"
                  />
                  <Input 
                    placeholder={t.primaryColor} 
                    {...field} 
                    className="w-full"
                  />
                </div>
              </FormControl>
              <FormMessage>
                {form.formState.errors.primaryColor?.message === 'Invalid color format'
                  ? t.colorError
                  : form.formState.errors.primaryColor?.message}
              </FormMessage>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit">{t.create}</Button>
        </div>
      </form>
    </Form>
  );
}