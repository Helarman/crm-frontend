'use client'

import { createContext, useContext, useState } from 'react'
import { VoiceAssistantSheet, VoiceAssistantButton } from '@/components/features/order/VoiceAssistant'

interface VoiceAssistantContextType {
  isOpen: boolean
  openAssistant: () => void
  closeAssistant: () => void
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined)

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openAssistant = () => setIsOpen(true)
  const closeAssistant = () => setIsOpen(false)

  return (
    <VoiceAssistantContext.Provider value={{ isOpen, openAssistant, closeAssistant }}>
      {children}
      <VoiceAssistantButton />
      <VoiceAssistantSheet open={isOpen} onOpenChange={setIsOpen} />
    </VoiceAssistantContext.Provider>
  )
}

export function useVoiceAssistantContext() {
  const context = useContext(VoiceAssistantContext)
  if (context === undefined) {
    throw new Error('useVoiceAssistantContext must be used within a VoiceAssistantProvider')
  }
  return context
}