"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Keyboard, KeyboardOff, Languages } from 'lucide-react'

type KeyboardLayout = {
  firstRow: string[]
  secondRow: string[]
  thirdRow: string[]
  fourthRow: string[]
  fifthRow: string[]
}

export function VirtualKeyboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ru' | 'ka'>('en')
  const [capsLock, setCapsLock] = useState(false)
  const [shiftPressed, setShiftPressed] = useState(false)
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)

  // Раскладки клавиатуры
  const layouts: Record<'en' | 'ru' | 'ka', KeyboardLayout> = {
    en: {
      firstRow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
      secondRow: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      thirdRow: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      fourthRow: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
      fifthRow: ['CapsLock', 'Space', 'Enter']
    },
    ru: {
      firstRow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
      secondRow: ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з'],
      thirdRow: ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д'],
      fourthRow: ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.'],
      fifthRow: ['CapsLock', 'Space', 'Enter']
    },
    ka: {
      firstRow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
      secondRow: ['ქ', 'წ', 'ე', 'რ', 'ტ', 'ყ', 'უ', 'ი', 'ო', 'პ'],
      thirdRow: ['ა', 'ს', 'დ', 'ფ', 'გ', 'ჰ', 'ჯ', 'კ', 'ლ'],
      fourthRow: ['ზ', 'ხ', 'ც', 'ვ', 'ბ', 'ნ', 'მ', ',', '.', '?'],
      fifthRow: ['CapsLock', 'Space', 'Enter']
    }
  }

  // Определяем текущую раскладку
  const currentLayout = layouts[language]

  // Обработчик изменения активного элемента
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        activeInputRef.current = target as HTMLInputElement | HTMLTextAreaElement
      }
    }

    const handleFocusOut = () => {
      // Не очищаем ref, чтобы сохранить фокус при нажатии на клавиатуру
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Восстанавливаем фокус при нажатии на клавиатуру
  const restoreFocus = () => {
    if (activeInputRef.current) {
      activeInputRef.current.focus()
      // Восстанавливаем позицию курсора
      const len = activeInputRef.current.value.length
      activeInputRef.current.setSelectionRange(len, len)
    }
  }

  // Обработчик нажатия клавиш
  const handleKeyPress = useCallback((key: string) => {
    if (!activeInputRef.current) return

    restoreFocus() // Восстанавливаем фокус перед вводом

    const element = activeInputRef.current
    const { selectionStart, selectionEnd } = element
    if (selectionStart === null || selectionEnd === null) return

    let newValue = element.value
    let newPos = selectionStart

    switch (key) {
      case 'Backspace':
        if (selectionStart === selectionEnd) {
          newValue = 
            newValue.substring(0, selectionStart - 1) + 
            newValue.substring(selectionEnd)
          newPos = selectionStart - 1
        } else {
          newValue = 
            newValue.substring(0, selectionStart) + 
            newValue.substring(selectionEnd)
          newPos = selectionStart
        }
        break

      case 'Space':
        newValue = 
          newValue.substring(0, selectionStart) + 
          ' ' + 
          newValue.substring(selectionEnd)
        newPos = selectionStart + 1
        break

      case 'Enter':
        newValue = 
          newValue.substring(0, selectionStart) + 
          '\n' + 
          newValue.substring(selectionEnd)
        newPos = selectionStart + 1
        break

      case 'CapsLock':
        setCapsLock(!capsLock)
        return

      default:
        let char = key
        if (/[a-zа-яჰ-ჿ]/.test(key)) {
          char = (capsLock !== shiftPressed) ? key.toUpperCase() : key.toLowerCase()
        }
        newValue = 
          newValue.substring(0, selectionStart) + 
          char + 
          newValue.substring(selectionEnd)
        newPos = selectionStart + char.length
    }

    element.value = newValue
    element.setSelectionRange(newPos, newPos)
    
    // Триггерим события для React
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))

    // Отключаем Shift после одного нажатия
    if (shiftPressed) {
      setShiftPressed(false)
    }
  }, [capsLock, shiftPressed])

  // Переключение языка
  const toggleLanguage = () => {
    setLanguage(prev => {
      switch (prev) {
        case 'en': return 'ru'
        case 'ru': return 'ka'
        case 'ka': return 'en'
        default: return 'en'
      }
    })
    restoreFocus()
  }

  // Рендер клавиши
  const renderKey = (key: string) => {
    const specialKeys: Record<string, { display: string, className: string }> = {
      Backspace: { display: '⌫', className: 'h-12 w-24' },
      Space: { display: 'Space', className: 'h-12 w-64' },
      Enter: { display: 'Enter', className: 'h-12 w-24' },
      CapsLock: { display: capsLock ? 'CAPS ON' : 'Caps', className: 'h-12 w-24' }
    }

    if (specialKeys[key]) {
      return (
        <Button
          key={key}
          variant={key === 'CapsLock' && capsLock ? 'default' : 'outline'}
          className={specialKeys[key].className}
          onClick={(e) => {
            e.preventDefault()
            handleKeyPress(key)
          }}
          onMouseDown={restoreFocus}
        >
          {specialKeys[key].display}
        </Button>
      )
    }

    const isLetter = /[a-zа-яჰ-ჿ]/i.test(key)
    const displayChar = (isLetter && (capsLock !== shiftPressed)) ? key.toUpperCase() : key

    return (
      <Button
        key={key}
        variant="outline"
        className={`h-12 w-12 ${shiftPressed && isLetter ? 'bg-accent' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          handleKeyPress(key)
        }}
        onMouseDown={(e) => {
          restoreFocus()
          if (e.shiftKey) setShiftPressed(true)
        }}
        onMouseUp={() => setShiftPressed(false)}
        onMouseLeave={() => setShiftPressed(false)}
      >
        {displayChar}
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2" ref={keyboardRef}>
      {isOpen && (
        <div className={`mb-4 p-4 bg-background border rounded-lg shadow-lg transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2">
              {currentLayout.firstRow.map(key => renderKey(key))}
            </div>
            <div className="flex gap-2">
              {currentLayout.secondRow.map(key => renderKey(key))}
            </div>
            <div className="flex gap-2">
              {currentLayout.thirdRow.map(key => renderKey(key))}
            </div>
            <div className="flex gap-2">
              {currentLayout.fourthRow.map(key => renderKey(key))}
            </div>
            <div className="flex gap-2">
              {currentLayout.fifthRow.map(key => renderKey(key))}
              <Button
                variant="outline"
                className="h-12 w-24"
                onClick={(e) => {
                  e.preventDefault()
                  toggleLanguage()
                }}
                onMouseDown={restoreFocus}
              >
                <Languages size={20} className="mr-2" />
                {language.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => {
          setIsOpen(!isOpen)
          restoreFocus()
        }}
      >
        {isOpen ? <KeyboardOff size={24} /> : <Keyboard size={24} />}
      </Button>
    </div>
  )
}