import { Category } from "./order"

export interface Additive {
  id: string
  title: string
  titleGe?: string
  price: number
}

export interface Product {
  id: string
  category: Category
  publishedOnWebsite: boolean
  printLabels: boolean
  publishedInApp: boolean
  isStopList: boolean
  title: string
  titleGe?: string
  price: number
  categoryId: string
  additives: Additive[]
  description?: string
  descriptionGe?: string
  ingredients: any
  images?: string[]
  restaurantPrices: {
    restaurantId: string
    price: number
    isStopList: boolean
  }[]
  workshops: {
    id: string;
    workshop: {
      name: string
      id: string
    }
  }[]
}