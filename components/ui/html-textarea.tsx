import * as React from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import { cn } from "@/lib/utils"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism.css"

interface HtmlTextareaProps extends Omit<React.ComponentProps<"textarea">, 'value' | 'onChange'> {
  value?: string
  onChange: (value: string) => void
  language?: 'html' | 'css' | 'javascript'
  showLineNumbers?: boolean
  className?: string
}

export function HtmlTextarea({ 
  className, 
  value = "",
  onChange,
  language = 'html',
  showLineNumbers = false,
  ...props 
}: any) {
  
  const highlightCode = (code: string) => {
    try {
      return highlight(code, languages[language], language)
    } catch (error) {
      return code
    }
  }
  
  return (
    <div className={cn("relative", className)}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={16}
        textareaId={props.id}
        className={cn(
          "min-h-16 w-full rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30 md:text-sm font-mono",
          showLineNumbers && "pl-12"
        )}
        // Добавляем стили для внутренних элементов Editor
        style={{
          height: '300px',
          overflow: 'auto',
        }}
        textareaClassName="outline-none focus:outline-none min-h-0"
        preClassName={cn(
          "font-mono text-sm block min-h-0",
          showLineNumbers && "inline-block"
        )}
        {...props}
      />
    </div>
  )
}