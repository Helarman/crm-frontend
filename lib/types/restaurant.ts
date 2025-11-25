import { Category } from './category'

export interface Restaurant {
  id: string
  title: string
  address?: string
  categories?: Category[]
}