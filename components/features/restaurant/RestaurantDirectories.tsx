'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ArchiveX,
  ArchiveRestore,
  Archive
} from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { toast } from 'sonner';
import { DictionariesService, DictionaryUtils } from '@/lib/api/dictionaries.service';
import { useDictionaries, useDictionaryCRUD } from '@/lib/hooks/useDictionaries';

interface RestaurantDirectoriesProps {
  restaurantId: string;
  restaurantName: string;
}

type DictionaryType = 'writeOff' | 'receipt' | 'movement' | 'income' | 'expense';

interface DictionaryTypeConfig {
  title: {
    ru: string;
    ka: string;
  };
  description: {
    ru: string;
    ka: string;
  };
  icon: React.ReactNode;
}

export function RestaurantDirectories({ restaurantId, restaurantName }: RestaurantDirectoriesProps) {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<DictionaryType>('writeOff');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [isOverwrite, setIsOverwrite] = useState(false);

  const {
    writeOffReasons,
    receiptReasons,
    movementReasons,
    incomeReasons,
    expenseReasons,
    loading,
    error,
    refresh
  } = useDictionaries(restaurantId);

  const { createItem, updateItem, deleteItem, loading: crudLoading } = useDictionaryCRUD(`${activeTab}Reasons` as any);

  const dictionaryTypes: Record<DictionaryType, DictionaryTypeConfig> = {
    writeOff: {
      title: {
        ru: 'Списания',
        ka: 'ჩამოწერები'
      },
      description: {
        ru: 'Управление причинами списания товаров со склада',
        ka: 'საწყობიდან პროდუქტების ჩამოწერის მიზეზების მართვა'
      },
      icon: <ArchiveX className="h-4 w-4" />
    },
    receipt: {
      title: {
        ru: 'Приходы',
        ka: 'მიღებები'
      },
      description: {
        ru: 'Управление причинами поступления товаров на склад',
        ka: 'საწყობში პროდუქტების მიღების მიზეზების მართვა'
      },
      icon: <ArchiveRestore className="h-4 w-4" />
    },
    movement: {
      title: {
        ru: 'Перемещения',
        ka: 'გადაადგილებები'
      },
      description: {
        ru: 'Управление причинами перемещения товаров между складами',
        ka: 'საწყობებს შორის პროდუქტების გადაადგილების მიზეზების მართვა'
      },
      icon: <Archive className="h-4 w-4" />
    },
    income: {
      title: {
        ru: 'Доходы',
        ka: 'შემოსავლები'
      },
      description: {
        ru: 'Управление причинами доходов ресторана',
        ka: 'რესტორნის შემოსავლების მიზეზების მართვა'
      },
      icon: <BanknoteArrowUp className="h-4 w-4" />
    },
    expense: {
      title: {
        ru: 'Расходы',
        ka: 'ხარჯები'
      },
      description: {
        ru: 'Управление причинами расходов ресторана',
        ka: 'რესტორნის ხარჯების მიზეზების მართვა'
      },
      icon: <BanknoteArrowDown className="h-4 w-4" />
    }
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'writeOff': return writeOffReasons;
      case 'receipt': return receiptReasons;
      case 'movement': return movementReasons;
      case 'income': return incomeReasons;
      case 'expense': return expenseReasons;
      default: return [];
    }
  };

  const filteredItems = getCurrentItems().filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = showOnlyActive ? item.isActive : true;
    return matchesSearch && matchesActive;
  });

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      toast.error('Введите название');
      return;
    }
    try {
      await createItem({
        name: newItemName.trim(),
        restaurantId,
        isActive: true
      });

      setNewItemName('');
      setIsCreateDialogOpen(false);
      toast.success('Запись успешно создана');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании записи');
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      await updateItem(item.id, {
        isActive: !item.isActive
      });
      toast.success('Статус обновлен');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при обновлении');
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }

    try {
      await deleteItem(item.id);
      toast.success('Запись удалена');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении');
    }
  };

  const handleCopyReasons = async () => {
    if (!selectedRestaurant) {
      toast.error('Выберите ресторан-источник');
      return;
    }

    try {
      await DictionariesService.copy.allReasons({
        sourceRestaurantId: selectedRestaurant,
        targetRestaurantId: restaurantId,
        overwrite: isOverwrite
      });

      setIsCopyDialogOpen(false);
      setSelectedRestaurant('');
      setIsOverwrite(false);
      toast.success('Справочники успешно скопированы');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при копировании');
    }
  };

  const translations = {
    pageTitle: {
      ru: 'Справочники склада',
      ka: 'საწყობის საცნობაროები'
    },
    search: {
      ru: 'Поиск...',
      ka: 'ძიება...'
    },
    activeOnly: {
      ru: 'Только активные',
      ka: 'მხოლოდ აქტიური'
    },
    create: {
      ru: 'Создать',
      ka: 'შექმნა'
    },
    copy: {
      ru: 'Копировать из другого ресторана',
      ka: 'კოპირება სხვა რესტორნიდან'
    },
    status: {
      ru: 'Статус',
      ka: 'სტატუსი'
    },
    actions: {
      ru: 'Действия',
      ka: 'მოქმედებები'
    },
    noItems: {
      ru: 'Нет записей',
      ka: 'ჩანაწერები არ არის'
    },
    createTitle: {
      ru: 'Создание записи',
      ka: 'ჩანაწერის შექმნა'
    },
    name: {
      ru: 'Название',
      ka: 'სახელი'
    },
    cancel: {
      ru: 'Отмена',
      ka: 'გაუქმება'
    },
    copyTitle: {
      ru: 'Копирование справочников',
      ka: 'საცნობაროების კოპირება'
    },
    sourceRestaurant: {
      ru: 'Ресторан-источник',
      ka: 'წყაროს რესტორნი'
    },
    overwrite: {
      ru: 'Перезаписать существующие',
      ka: 'არსებულის გადაწერა'
    },
    copyButton: {
      ru: 'Копировать',
      ka: 'კოპირება'
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Ошибка загрузки справочников
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Адаптивные кнопки выбора справочника */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          {(Object.entries(dictionaryTypes) as [DictionaryType, DictionaryTypeConfig][]).map(([type, config]) => (
            <Button
              key={type}
              variant={activeTab === type ? "default" : "outline"}
              className="flex items-center gap-2 whitespace-nowrap flex-1 sm:flex-none"
              onClick={() => setActiveTab(type)}
            >
              {config.icon}
              {config.title[language]}
            </Button>
          ))}
        </div>
      </div>

      {/* Описание текущего типа */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">
          {dictionaryTypes[activeTab].title[language]}
        </h3>
        <p className="text-sm text-muted-foreground">
          {dictionaryTypes[activeTab].description[language]}
        </p>
      </div>

      {/* Панель управления */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translations.search[language]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={showOnlyActive}
              onCheckedChange={setShowOnlyActive}
            />
            <Label className="text-sm whitespace-nowrap">
              {translations.activeOnly[language]}
            </Label>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {translations.create[language]}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translations.createTitle[language]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{translations.name[language]}</Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={dictionaryTypes[activeTab].title[language]}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {translations.cancel[language]}
                </Button>
                <Button onClick={handleCreateItem} disabled={crudLoading}>
                  {translations.create[language]}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/*<Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {translations.copy[language]}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translations.copyTitle[language]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{translations.sourceRestaurant[language]}</Label>
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите ресторан" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant1">Ресторан 1</SelectItem>
                      <SelectItem value="restaurant2">Ресторан 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isOverwrite}
                    onCheckedChange={setIsOverwrite}
                  />
                  <Label className="text-sm">
                    {translations.overwrite[language]}
                </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                >
                  {translations.cancel[language]}
                </Button>
                <Button onClick={handleCopyReasons} disabled={!selectedRestaurant}>
                  {translations.copyButton[language]}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
*/}
        </div>
      </div>

      {/* Список записей */}
      <div className="border rounded-lg">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div className="col-span-8">{dictionaryTypes[activeTab].title[language]}</div>
          <div className="col-span-2 text-center">{translations.status[language]}</div>
          <div className="col-span-2 text-center">{translations.actions[language]}</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Загрузка...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {translations.noItems[language]}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-muted/50 transition-colors"
            >
              <div className="col-span-8 font-medium">{item.name}</div>

              <div className="col-span-2 flex justify-center">
                <Badge
                  variant={item.isActive ? "default" : "secondary"}
                  className={item.isActive ? "bg-green-100 text-green-800" : ""}
                >
                  {item.isActive ? 'Активна' : 'Неактивна'}
                </Badge>
              </div>

              <div className="col-span-2 flex justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(item)}
                  title={item.isActive ? 'Деактивировать' : 'Активировать'}
                >
                  {item.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteItem(item)}
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}