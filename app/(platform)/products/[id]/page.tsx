'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductService } from '@/lib/api/product.service'
import { Additive, AdditiveService } from '@/lib/api/additive.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { CategoryService } from '@/lib/api/category.service'
import { WorkshopService } from '@/lib/api/workshop.service'
import { WarehouseService } from '@/lib/api/warehouse.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/features/menu/product/ImageUploader'
import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
import IngredientSelect from '@/components/features/menu/product/IngredientSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useAuth } from '@/lib/hooks/useAuth'
import { Restaurant } from '@/lib/types/restaurant'

interface RestaurantPrice {
  restaurantId: string
  price: number
  isStopList: boolean
}

interface Workshop {
  id: string
  name: string
}

type FormStep = 'basic' | 'details' | 'images' | 'additives' | 'ingredients' | 'prices' | 'seo'

const ProductEditPage = () => {
  const params = useParams()
  const productId = params.id
  const { language } = useLanguageStore()
  const router = useRouter()
  const { user } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    composition: '',
    price: 0,
    images: [''],
    categoryId: '',
    weight: undefined as number | undefined,
    preparationTime: undefined as number | undefined,
    packageQuantity: undefined as number | undefined,
    quantity: 0,
    printLabels: false,
    publishedOnWebsite: false,
    publishedInApp: false,
    isStopList: false,
    pageTitle: '',
    metaDescription: '',
    content: '',
  })

  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])
  const [additives, setAdditives] = useState<{ id: string; title: string; price: number }[]>([])
  const [allRestaurants, setAllRestaurants] = useState<{ id: string; title: string }[]>([])
  const [userRestaurants, setUserRestaurants] = useState<{ id: string; title: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [restaurantPrices, setRestaurantPrices] = useState<RestaurantPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdditivesLoading, setIsAdditivesLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false)
  const [isWorkshopsLoading, setIsWorkshopsLoading] = useState(false)
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<{inventoryItemId: string, quantity: number}[]>([])
  const [inventoryItems, setInventoryItems] = useState<{id: string, name: string, unit: string}[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(false)

  useEffect(() => {
    loadData()
    loadCategories()
    loadRestaurants()
    loadWorkshops()
    loadInventoryItems()
    loadAdditives()
  }, [])

  useEffect(() => {
    if (user?.restaurant && allRestaurants.length > 0) {
      const filteredRestaurants = allRestaurants.filter(restaurant => 
        user.restaurant?.some((userRestaurant : Restaurant) => userRestaurant.id === restaurant.id)
      )
      setUserRestaurants(filteredRestaurants)
    }
  }, [user, allRestaurants])

  const loadWorkshops = async () => {
    setIsWorkshopsLoading(true)
    try {
      const data = await WorkshopService.getAll()
      setWorkshops(data)
    } catch (error) {
      console.error('Failed to load workshops', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки цехов' : 'სახელოსნოების ჩატვირთვის შეცდომა')
    } finally {
      setIsWorkshopsLoading(false)
    }
  }

  const loadInventoryItems = async () => {
    setIsInventoryLoading(true);
    try {
      const items = await WarehouseService.getAllInventoryItems();
      
      const formattedItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        categoryId: item.categoryId,
      }));
      
      setInventoryItems(formattedItems);
    } catch (error) {
      console.error('Failed to load inventory items', error);
      toast.error(language === 'ru' 
        ? 'Ошибка загрузки ингредиентов' 
        : 'ინგრედიენტების ჩატვირთვის შეცდომა');
      setInventoryItems([]);
    } finally {
      setIsInventoryLoading(false);
    }
  }

  const loadData = async () => {
    if (!productId) {
      resetForm()
      return
    }
    
    setIsLoading(true)
    try {
     const [product, productAdditives, prices, productIngredients] = await Promise.all([
        ProductService.getById(productId as string),
        AdditiveService.getByProduct(productId as string),
        ProductService.getRestaurantPrices(productId as string),
        ProductService.getIngredients(productId as string),
      ])
      setFormData({
        title: product.title,
        description: product.description,
        composition: product.composition,
        price: product.price,
        images: product.images.length ? product.images : [''],
        categoryId: product.categoryId,
        weight: product.weight,
        preparationTime: product.preparationTime,
        packageQuantity: product.packageQuantity,
        quantity: product.quantity || 0,
        printLabels: product.printLabels,
        publishedOnWebsite: product.publishedOnWebsite,
        publishedInApp: product.publishedInApp,
        isStopList: product.isStopList,
        pageTitle: product.pageTitle || '',
        metaDescription: product.metaDescription || '',
        content: product.content || '',
      })

      setSelectedAdditives(productAdditives.map((a: Additive) => a.id))
      setRestaurantPrices(prices)
      
      const userRestaurantIds = user?.restaurants?.map((r : Restaurant) => r.id) || []
      const filteredSelectedRestaurants = prices
        .map((p: RestaurantPrice) => p.restaurantId)
        .filter((id: string) => userRestaurantIds.includes(id))
      
      setSelectedRestaurants(filteredSelectedRestaurants)
      setSelectedWorkshops(product.workshops?.map((w: any) => w.workshop.id) || [])
      setIngredients(productIngredients || [])
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      composition: '',
      price: 0,
      images: [''],
      categoryId: '',
      weight: undefined,
      preparationTime: undefined,
      packageQuantity: undefined,
      quantity: 0,
      printLabels: false,
      publishedOnWebsite: false,
      publishedInApp: false,
      isStopList: false,
      pageTitle: '',
      metaDescription: '',
      content: '',
    })
    setSelectedAdditives([])
    setSelectedRestaurants([])
    setRestaurantPrices([])
    setCurrentStep('basic')
    setSelectedWorkshops([])
    setIngredients([])
  }

  const loadCategories = async () => {
    setIsCategoriesLoading(true)
    try {
      const data = await CategoryService.getAll()
      setCategories(data as any)
    } catch (error) {
      console.error('Failed to load categories', error)
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  const loadRestaurants = async () => {
    setIsRestaurantsLoading(true)
    try {
      const data = await RestaurantService.getAll()
      setAllRestaurants(data)
    } catch (error) {
      console.error('Failed to load restaurants', error)
    } finally {
      setIsRestaurantsLoading(false)
    }
  }

  const loadAdditives = async () => {
    setIsAdditivesLoading(true)
    try {
      const data = await AdditiveService.getAll()
      setAdditives(data)
    } catch (error) {
      console.error('Failed to load additives', error)
    } finally {
      setIsAdditivesLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: ['price', 'weight', 'preparationTime', 'packageQuantity', 'quantity'].includes(name) 
        ? Number(value) 
        : value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleImageChange = (images: string[]) => {
    setFormData({
      ...formData,
      images,
    })
  }

  const toggleAdditive = (additiveId: string) => {
    setSelectedAdditives(prev =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    )
  }

  const handleRestaurantsChange = (selectedIds: string[]) => {
    // Определяем добавленные и удаленные рестораны
    const added = selectedIds.filter(id => !selectedRestaurants.includes(id));
    const removed = selectedRestaurants.filter(id => !selectedIds.includes(id));

    // Обновляем selectedRestaurants
    setSelectedRestaurants(selectedIds);

    // Обновляем restaurantPrices
    setRestaurantPrices(prev => {
      // Удаляем цены для убранных ресторанов
      let updated = prev.filter(rp => !removed.includes(rp.restaurantId));
      
      // Добавляем цены для новых ресторанов
      added.forEach(restaurantId => {
        if (!updated.some(rp => rp.restaurantId === restaurantId)) {
          updated.push({
            restaurantId,
            price: formData.price,
            isStopList: false
          });
        }
      });
      
      return updated;
    });
  };

  const handleRestaurantPriceChange = (restaurantId: string, field: 'price' | 'isStopList', value: any) => {
    setRestaurantPrices(prev => {
      const existing = prev.find(rp => rp.restaurantId === restaurantId)
      if (existing) {
        return prev.map(rp => 
          rp.restaurantId === restaurantId 
            ? { ...rp, [field]: field === 'price' ? Number(value) : value }
            : rp
        )
      } else {
        return [
          ...prev, 
          {
            restaurantId,
            price: field === 'price' ? Number(value) : formData.price,
            isStopList: field === 'isStopList' ? value : false
          }
        ]
      }
    })
  }

  const getRestaurantPrice = (restaurantId: string) => {
    return restaurantPrices.find(rp => rp.restaurantId === restaurantId) || {
      restaurantId,
      price: formData.price,
      isStopList: false
    }
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.title.trim()) {
      errors.push(language === 'ru' ? 'Название продукта обязательно' : 'პროდუქტის სახელი სავალდებულოა')
    }
    if (!formData.categoryId) {
      errors.push(language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია')
    }
    if (formData.price <= 0) {
      errors.push(language === 'ru' ? 'Цена должна быть больше 0' : 'ფასი უნდა იყოს 0-ზე მეტი')
    }
    if (selectedRestaurants.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც')
    }
    const hasEmptyIngredients = ingredients.some(
      i => !i.inventoryItemId || i.quantity <= 0
    )
    if (hasEmptyIngredients) {
      errors.push(language === 'ru' 
        ? 'Укажите корректные ингредиенты' 
        : 'მიუთითეთ სწორი ინგრედიენტები')
    }
    
    if (errors.length > 0) {
      toast.error(errors.join('\n'))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const productData = {
        ...formData,
        ingredients: ingredients.filter(i => i.inventoryItemId && i.quantity > 0)
          .map(i => ({
            inventoryItemId: i.inventoryItemId,
            quantity: parseFloat(i.quantity.toString())
          })),
        images: formData.images.filter(img => img.trim()),
        restaurantPrices: restaurantPrices.filter(rp => 
          selectedRestaurants.includes(rp.restaurantId)
        ),
        additives: selectedAdditives,
        workshopIds: selectedWorkshops,
      }

      const updatedProduct = await ProductService.update(productId as string, productData)

      await Promise.all(
        selectedRestaurants.map(restaurantId => 
          RestaurantService.addProduct(restaurantId, { productId: productId as string })
            .catch(error => {
              console.error(`Failed to add product to restaurant ${restaurantId}:`, error)
            })
        )
      )

      toast.success(language === 'ru' ? 'Продукт обновлен' : 'პროდუქტი განახლებულია')
      router.back()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const translations = {
    basic: {
      ru: 'Основная информация',
      ka: 'ძირითადი ინფორმაცია',
    },
    details: {
      ru: 'Детали',
      ka: 'დეტალები',
    },
    images: {
      ru: 'Изображения',
      ka: 'სურათები',
    },
    additives: {
      ru: 'Модификаторы',
      ka: 'მოდიფიკატორები',
    },
    ingredients: {
      ru: 'Ингредиенты',
      ka: 'ინგრედიენტები',
    },
    prices: {
      ru: 'Цены',
      ka: 'ფასები',
    },
    seo: {
      ru: 'SEO',
      ka: 'SEO',
    },
    save: {
      ru: 'Сохранить',
      ka: 'შენახვა',
    },
    back: {
      ru: 'Назад',
      ka: 'უკან',
    },
     composition: { 
      ru: 'Состав',
      ka: 'შემადგენლობა',
    },
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                {language === 'ru' ? 'Название' : 'სახელი'} *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                {language === 'ru' ? 'Описание' : 'აღწერა'}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="composition" className="text-sm"> 
                {translations.composition[language]} 
              </Label>
              <Textarea
                id="composition"
                name="composition" 
                value={formData.composition}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm">
                {language === 'ru' ? 'Категория' : 'კატეგორია'} *
              </Label>
              {isCategoriesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchableSelect
                  options={categories.map(c => ({ id: c.id, label: c.title }))}
                  value={formData.categoryId ? [formData.categoryId] : []}
                  onChange={([id]) => setFormData({...formData, categoryId: id || ''})}
                  placeholder={language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია'}
                  searchPlaceholder={language === 'ru' ? 'Поиск категорий...' : 'კატეგორიების ძებნა...'}
                  emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                  multiple={false}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm">
                {language === 'ru' ? 'Базовая цена' : 'საბაზისო ფასი'} *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        )

      case 'details':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm">
                  {language === 'ru' ? 'Вес (г)' : 'წონა (გ)'}
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationTime" className="text-sm">
                  {language === 'ru' ? 'Время приготовления (мин)' : 'მომზადების დრო (წთ)'}
                </Label>
                <Input
                  id="preparationTime"
                  name="preparationTime"
                  type="number"
                  min="0"
                  value={formData.preparationTime || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm">
                  {language === 'ru' ? 'Количество' : 'რაოდენობა'}
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageQuantity" className="text-sm">
                  {language === 'ru' ? 'Кол-во в упаковке' : 'რაოდენობა შეფუთვაში'}
                </Label>
                <Input
                  id="packageQuantity"
                  name="packageQuantity"
                  type="number"
                  min="0"
                  value={formData.packageQuantity || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Цехи' : 'სახელოსნოები'}
                </Label>
                {isWorkshopsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchableSelect
                    options={workshops.map(w => ({ id: w.id, label: w.name }))}
                    value={selectedWorkshops}
                    onChange={setSelectedWorkshops}
                    placeholder={language === 'ru' ? 'Выберите цехи' : 'აირჩიეთ სახელოსნოები'}
                    searchPlaceholder={language === 'ru' ? 'Поиск цехов...' : 'სახელოსნოების ძებნა...'}
                    emptyText={language === 'ru' ? 'Цехи не найдены' : 'სახელოსნოები ვერ მოიძებნა'}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="printLabels" className="text-sm">
                  {language === 'ru' ? 'Печать лейблов' : 'ლეიბლების დაბეჭდვა'}
                </Label>
                <Switch
                  id="printLabels"
                  checked={formData.printLabels}
                  onCheckedChange={checked => handleSwitchChange('printLabels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedOnWebsite" className="text-sm">
                  {language === 'ru' ? 'Опубликовать на сайте' : 'საიტზე გამოქვეყნება'}
                </Label>
                <Switch
                  id="publishedOnWebsite"
                  checked={formData.publishedOnWebsite}
                  onCheckedChange={checked => handleSwitchChange('publishedOnWebsite', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedInApp" className="text-sm">
                  {language === 'ru' ? 'Опубликовать в приложении' : 'აპლიკაციაში გამოქვეყნება'}
                </Label>
                <Switch
                  id="publishedInApp"
                  checked={formData.publishedInApp}
                  onCheckedChange={checked => handleSwitchChange('publishedInApp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isStopList" className="text-sm">
                  {language === 'ru' ? 'В стоп-листе' : 'სტოპ ლისტში'}
                </Label>
                <Switch
                  id="isStopList"
                  checked={formData.isStopList}
                  onCheckedChange={checked => handleSwitchChange('isStopList', checked)}
                />
              </div>
            </div>
          </div>
        )

      case 'images':
        return (
          <div className="space-y-4">
            <ImageUploader
              value={formData.images.filter(img => img.trim())}
              onChange={handleImageChange}
              maxFiles={5}
              language={language}
            />
          </div>
        )
      
      case 'prices':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
              </Label>
              {isRestaurantsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchableSelect
                  options={userRestaurants.map(r => ({ id: r.id, label: r.title }))}
                  value={selectedRestaurants}
                  onChange={handleRestaurantsChange}
                  placeholder={language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                  searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'}
                  emptyText={language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                />
              )}
            </div>
            {selectedRestaurants.length > 0 && (
              <div className="space-y-3">
                {selectedRestaurants.map(restaurantId => {
                  const restaurant = userRestaurants.find(r => r.id === restaurantId)
                  if (!restaurant) return null
                  
                  const priceInfo = getRestaurantPrice(restaurantId)
                  return (
                    <div key={restaurantId} className="grid grid-cols-3 gap-4 items-center">
                      <Label className="text-sm">{restaurant.title}</Label>
                      
                      <Input
                        type="number"
                        min="0"
                        value={priceInfo.price}
                        onChange={e => handleRestaurantPriceChange(
                          restaurantId, 
                          'price', 
                          e.target.value
                        )}
                        className="text-sm"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={priceInfo.isStopList}
                          onCheckedChange={checked => handleRestaurantPriceChange(
                            restaurantId, 
                            'isStopList', 
                            checked
                          )}
                        />
                        <Label className="text-sm">
                          {language === 'ru' ? 'Стоп-лист' : 'სტოპ ლისტი'}
                        </Label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      
      case 'additives':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {language === 'ru' ? 'Выберите Модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
            </Label>
            {isAdditivesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchableSelect
                options={additives.map(a => ({ id: a.id, label: `${a.title} (+${a.price}₽)` }))}
                value={selectedAdditives}
                onChange={setSelectedAdditives}
                placeholder={language === 'ru' ? 'Выберите Модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
                searchPlaceholder={language === 'ru' ? 'Поиск добавок...' : 'მოდიფიკატორების ძებნა...'}
                emptyText={language === 'ru' ? 'Модификаторы не найдены' : 'მოდიფიკატორები ვერ მოიძებნა'}
              />
            )}
          </div>
        )

      case 'ingredients':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {language === 'ru' ? 'Ингредиенты продукта' : 'პროდუქტის ინგრედიენტები'}
              </Label>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <IngredientSelect
                    key={index}
                    value={ingredient}
                    onChange={(newValue) => {
                      const newIngredients = [...ingredients]
                      newIngredients[index] = newValue
                      setIngredients(newIngredients)
                    }}
                    onRemove={() => {
                      const newIngredients = [...ingredients]
                      newIngredients.splice(index, 1)
                      setIngredients(newIngredients)
                    }}
                    inventoryItems={inventoryItems}
                    language={language}
                  />
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="mt-2 text-sm"
                onClick={() => setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'ru' ? 'Добавить ингредиент' : 'ინგრედიენტის დამატება'}
              </Button>
            </div>
          </div>
        )

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle" className="text-sm">
                {language === 'ru' ? 'Заголовок страницы' : 'გვერდის სათაური'}
              </Label>
              <Input
                id="pageTitle"
                name="pageTitle"
                value={formData.pageTitle}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-sm">
                {language === 'ru' ? 'Мета описание' : 'მეტა აღწერა'}
              </Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm">
                {language === 'ru' ? 'Контент' : 'კონტენტი'}
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="text-sm min-h-[100px] resize-none"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ru' ? 'Редактирование продукта' : 'პროდუქტის რედაქტირება'}
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translations.back[language]}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translations.save[language]}...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {translations.save[language]}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic" onClick={() => setCurrentStep('basic')}>
            {translations.basic[language]}
          </TabsTrigger>
          <TabsTrigger value="details" onClick={() => setCurrentStep('details')}>
            {translations.details[language]}
          </TabsTrigger>
          <TabsTrigger value="images" onClick={() => setCurrentStep('images')}>
            {translations.images[language]}
          </TabsTrigger>
          <TabsTrigger value="additives" onClick={() => setCurrentStep('additives')}>
            {translations.additives[language]}
          </TabsTrigger>
          <TabsTrigger value="ingredients" onClick={() => setCurrentStep('ingredients')}>
            {translations.ingredients[language]}
          </TabsTrigger>
          <TabsTrigger value="prices" onClick={() => setCurrentStep('prices')}>
            {translations.prices[language]}
          </TabsTrigger>
          <TabsTrigger value="seo" onClick={() => setCurrentStep('seo')}>
            {translations.seo[language]}
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <TabsContent value="basic">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="details">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="images">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="additives">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="ingredients">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="prices">
                  {renderStepContent()}
                </TabsContent>

                <TabsContent value="seo">
                  {renderStepContent()}
                </TabsContent>
              </form>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

export default ProductEditPage