import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PageHeaderProps {
  title: string
  buttonText?: string
  onButtonClick?: () => void
  showButton?: boolean
  icon: any
}

export function PageHeader({
  title,
  buttonText = "Добавить",
  onButtonClick,
  showButton = true
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      
      {showButton && (
        <Button onClick={onButtonClick}>
          <Plus className="mr-1 h-4 w-4" />
          {buttonText}
        </Button>
      )}
    </div>
  )
}