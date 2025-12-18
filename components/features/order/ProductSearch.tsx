
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2 } from 'lucide-react'

interface ProductSearchProps {
  onSearch: (query: string) => void
  onClear: () => void
  language: 'ru' | 'ka'
  isSearching: boolean
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  onSearch,
  onClear,
  language,
  isSearching
}) => {
  const [localQuery, setLocalQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce локально в компоненте
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(localQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [localQuery, onSearch])

  const handleClear = () => {
    setLocalQuery('')
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div className="mb-6">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={language === 'ru' ? "Поиск продуктов..." : "პროდუქტების ძებნა..."}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-10 pr-10 py-2 text-base"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={handleClear}
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isSearching && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">
            {language === 'ru' ? 'Поиск...' : 'ძებნა...'}
          </span>
        </div>
      )}
    </div>
  )
}

export default ProductSearch