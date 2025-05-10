import { 
    CircleDashed, 
    Clock, 
    CookingPot, 
    Check, 
    Truck, 
    CheckCircle, 
    X 
  } from 'lucide-react'
  
  export const statusConfig = {
    CREATED: {
      bg: 'bg-blue-50/80',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: '',
      progress: 'bg-blue-500'
    },
    CONFIRMED: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '',
      progress: 'bg-amber-500'
    },
    PREPARING: {
      bg: 'bg-orange-50/80',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: '',
      progress: 'bg-orange-500'
    },
    READY: {
      bg: 'bg-green-50/80',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '',
      progress: 'bg-green-500'
    },
    DELIVERING: {
      bg: 'bg-purple-50/80',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: '',
      progress: 'bg-purple-500'
    },
    COMPLETED: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: '',
      progress: 'bg-emerald-500'
    },
    CANCELLED: {
      bg: 'bg-red-50/80',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: '',
      progress: 'bg-red-500'
    }
  } as const