'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Users, Trash2, Edit, Search } from 'lucide-react'
import { CreateWorkshopDto, WorkshopResponseDto, WorkshopService,  } from '@/lib/api/workshop.service'
import { UserService } from '@/lib/api/user.service'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'

interface RestaurantWorkshopsProps {
  restaurantId: string
  restaurantName: string
}

interface User {
  id: string
  name: string
  email: string
}

export function RestaurantWorkshops({ restaurantId, restaurantName }: RestaurantWorkshopsProps) {
  const { language } = useLanguageStore()
  const [workshops, setWorkshops] = useState<WorkshopResponseDto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopResponseDto | null>(null)
  const [newWorkshopName, setNewWorkshopName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const translations = {
    title: {
      ru: 'Цехи ресторана',
      ka: 'რესტორანის სახელოსნოები'
    },
    createWorkshop: {
      ru: 'Создать цех',
      ka: 'სახელოსნოს შექმნა'
    },
    workshopName: {
      ru: 'Название цеха',
      ka: 'სახელოსნოს სახელი'
    },
    search: {
      ru: 'Поиск цехов...',
      ka: 'სახელოსნოების ძებნა...'
    },
    name: {
      ru: 'Название',
      ka: 'სახელი'
    },
    users: {
      ru: 'Пользователи',
      ka: 'მომხმარებლები'
    },
    actions: {
      ru: 'Действия',
      ka: 'მოქმედებები'
    },
    assignUsers: {
      ru: 'Назначить пользователей',
      ka: 'მომხმარებლების მინიჭება'
    },
    selectUsers: {
      ru: 'Выберите пользователей',
      ka: 'აირჩიეთ მომხმარებლები'
    },
    noWorkshops: {
      ru: 'Цехи не найдены',
      ka: 'სახელოსნოები ვერ მოიძებნა'
    },
    create: {
      ru: 'Создать',
      ka: 'შექმნა'
    },
    assign: {
      ru: 'Назначить',
      ka: 'მინიჭება'
    },
    cancel: {
      ru: 'Отмена',
      ka: 'გაუქმება'
    },
    workshopCreated: {
      ru: 'Цех успешно создан',
      ka: 'სახელოსნო წარმატებით შეიქმნა'
    },
    usersAssigned: {
      ru: 'Пользователи успешно назначены',
      ka: 'მომხმარებლები წარმატებით დაემატა'
    },
    workshopDeleted: {
      ru: 'Цех успешно удален',
      ka: 'სახელოსნო წარმატებით წაიშალა'
    },
    error: {
      ru: 'Произошла ошибка',
      ka: 'დაფიქსირდა შეცდომა'
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [workshopsData, usersData] = await Promise.all([
        WorkshopService.getByRestaurantId(restaurantId),
        UserService.getAll()
      ])
      setWorkshops(workshopsData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error(translations.error[language])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [restaurantId])

  const handleCreateWorkshop = async () => {
    if (!newWorkshopName.trim()) return

    try {
      const workshopDto: CreateWorkshopDto  = {
        id: '',
        name: newWorkshopName,
        restaurantId: restaurantId
      }
      await WorkshopService.create(workshopDto)
      setNewWorkshopName('')
      setIsCreateDialogOpen(false)
      await loadData()
      toast.success(translations.workshopCreated[language])
    } catch (error) {
      console.error('Failed to create workshop:', error)
      toast.error(translations.error[language])
    }
  }

  const handleAssignUsers = async () => {
    if (!selectedWorkshop || selectedUsers.length === 0) return

    try {
      await WorkshopService.addUsers(selectedWorkshop.id, selectedUsers)
      setSelectedUsers([])
      setIsAssignDialogOpen(false)
      setSelectedWorkshop(null)
      await loadData()
      toast.success(translations.usersAssigned[language])
    } catch (error) {
      console.error('Failed to assign users:', error)
      toast.error(translations.error[language])
    }
  }

  const handleDeleteWorkshop = async (workshopId: string) => {
    if (!confirm('Вы уверены, что хотите удалить цех?')) return

    try {
      await WorkshopService.delete(workshopId)
      await loadData()
      toast.success(translations.workshopDeleted[language])
    } catch (error) {
      console.error('Failed to delete workshop:', error)
      toast.error(translations.error[language])
    }
  }

  const openAssignDialog = (workshop: any) => {
    setSelectedWorkshop(workshop)
    setSelectedUsers([])
    setIsAssignDialogOpen(true)
  }

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-32">Загрузка...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder={translations.search[language]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {translations.createWorkshop[language]}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translations.createWorkshop[language]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workshop-name" className='mb-4'>{translations.workshopName[language]}</Label>
                <Input
                  id="workshop-name"
                  value={newWorkshopName}
                  onChange={(e) => setNewWorkshopName(e.target.value)}
                  placeholder={translations.workshopName[language]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {translations.cancel[language]}
                </Button>
                <Button onClick={handleCreateWorkshop}>
                  {translations.create[language]}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translations.title[language]}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.name[language]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkshops.map((workshop) => (
                <TableRow key={workshop.id}>
                  <TableCell className="font-medium">{workshop.name}</TableCell>
                 
                </TableRow>
              ))}
              {filteredWorkshops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {translations.noWorkshops[language]}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translations.assignUsers[language]} - {selectedWorkshop?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{translations.selectUsers[language]}</Label>
              <Select onValueChange={(value) => {
                if (!selectedUsers.includes(value)) {
                  setSelectedUsers([...selectedUsers, value])
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.selectUsers[language]} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Выбранные пользователи:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId)
                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                      {user?.name}
                      <button
                        onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                {translations.cancel[language]}
              </Button>
              <Button onClick={handleAssignUsers} disabled={selectedUsers.length === 0}>
                {translations.assign[language]}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}