"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils/index"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Тип для пропса confirmClose
interface ConfirmCloseProps {
  confirmClose?: boolean
  confirmMessage?: React.ReactNode
  onCloseAttempt?: () => boolean | Promise<boolean> | void
}

// Кастомное модальное окно для подтверждения
function ConfirmCloseModal({
  isOpen,
  onConfirm,
  onCancel,
  message = "Вы уверены, что хотите закрыть? Несохраненные изменения будут потеряны.",
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  message?: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div 
        className="relative z-[10000] w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background rounded-lg border shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                {typeof message === 'string' ? (
                  <p className="text-sm text-foreground">{message}</p>
                ) : (
                  message
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onCancel()
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onConfirm()
                  }}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

// Кастомная реализация Dialog Content с поддержкой подтверждения закрытия
function DialogContentComponent({
  className,
  children,
  confirmClose = false,
  confirmMessage = "Вы уверены, что хотите закрыть? Несохраненные изменения будут потеряны.",
  onCloseAttempt,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & ConfirmCloseProps) {
  const [showConfirm, setShowConfirm] = React.useState(false)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Обработчик для кнопки закрытия
  const handleCloseClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirmClose) {
      // Программно нажимаем на стандартную кнопку закрытия Radix UI
      closeRef.current?.click()
      return
    }

    if (onCloseAttempt) {
      const result = onCloseAttempt()
      if (result instanceof Promise) {
        const shouldClose = await result
        if (shouldClose === false) {
          return
        }
        if (shouldClose === true || shouldClose === undefined) {
          setShowConfirm(true)
        }
      } else if (result === false) {
        return
      } else {
        setShowConfirm(true)
      }
    } else {
      setShowConfirm(true)
    }
  }

  // Обработчик для клика на оверлей
  const handleInteractOutside = async (e: Event) => {
    if (showConfirm) {
      e.preventDefault()
      return false
    }

    if (!confirmClose) {
      return
    }

    e.preventDefault()
    
    if (onCloseAttempt) {
      const result = onCloseAttempt()
      if (result instanceof Promise) {
        const shouldClose = await result
        if (shouldClose === false) {
          return false
        }
        if (shouldClose === true || shouldClose === undefined) {
          setShowConfirm(true)
          return false
        }
      } else if (result === false) {
        return false
      } else {
        setShowConfirm(true)
        return false
      }
    } else {
      setShowConfirm(true)
      return false
    }
  }

  // Обработчик Escape
  const handleEscapeKeyDown = async (e: KeyboardEvent) => {
    if (showConfirm) {
      e.preventDefault()
      return
    }

    if (!confirmClose) {
      return
    }

    e.preventDefault()
    
    if (onCloseAttempt) {
      const result = onCloseAttempt()
      if (result instanceof Promise) {
        const shouldClose = await result
        if (shouldClose === false) {
          return
        }
        if (shouldClose === true || shouldClose === undefined) {
          setShowConfirm(true)
        }
      } else if (result === false) {
        return
      } else {
        setShowConfirm(true)
      }
    } else {
      setShowConfirm(true)
    }
  }

  // Подтверждение закрытия
  const handleConfirmClose = React.useCallback(() => {
    
    // Имитируем клик на кнопку закрытия
    setTimeout(() => {
      closeRef.current?.click()
    }, 0)
    setShowConfirm(false)
  }, [])

  // Отмена закрытия
  const handleCancelClose = React.useCallback(() => {
    setShowConfirm(false)
  }, [])

  return (
    <>
      {!showConfirm && <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          "max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden",
          showConfirm ? "pointer-events-none opacity-50" : "",
          className
        )}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        onPointerDownOutside={showConfirm ? (e) => e.preventDefault() : undefined}
        {...props}
      >
        {children}
        {/* Невидимая кнопка закрытия Radix UI */}
        <DialogPrimitive.Close
          ref={closeRef}
          className="sr-only"
          aria-hidden="true"
        />
        {/* Видимая кастомная кнопка закрытия */}
        <button
          type="button"
          onClick={handleCloseClick}
          className={cn(
            "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          )}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </button>
      </DialogPrimitive.Content>
}
      {/* Модальное окно подтверждения закрытия */}
      <ConfirmCloseModal
        isOpen={showConfirm}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        message={confirmMessage}
      />
    </>
  )
}
// Оригинальный DialogContent (стандартная ширина)
function DialogContent({
  className,
  children,
  confirmClose,
  confirmMessage,
  onCloseAttempt,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & ConfirmCloseProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContentComponent
        className={cn("sm:max-w-lg", className)}
        confirmClose={confirmClose}
        confirmMessage={confirmMessage}
        onCloseAttempt={onCloseAttempt}
        {...props}
      >
        {children}
      </DialogContentComponent>
    </DialogPortal>
  )
}

// Wide DialogContent с увеличенной шириной
function DialogContentWide({
  className,
  children,
  confirmClose,
  confirmMessage,
  onCloseAttempt,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & ConfirmCloseProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContentComponent
        className={cn("sm:max-w-4xl", className)}
        confirmClose={confirmClose}
        confirmMessage={confirmMessage}
        onCloseAttempt={onCloseAttempt}
        {...props}
      >
        {children}
      </DialogContentComponent>
    </DialogPortal>
  )
}

// Extra Wide DialogContent для очень широкого контента
function DialogContentExtraWide({
  className,
  children,
  confirmClose,
  confirmMessage,
  onCloseAttempt,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & ConfirmCloseProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContentComponent
        className={cn("sm:max-w-7xl", className)}
        confirmClose={confirmClose}
        confirmMessage={confirmMessage}
        onCloseAttempt={onCloseAttempt}
        {...props}
      >
        {children}
      </DialogContentComponent>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentWide,
  DialogContentExtraWide,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type ConfirmCloseProps,
}