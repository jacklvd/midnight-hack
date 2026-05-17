'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

type CopyButtonProps = {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard write can fail in insecure contexts; ignore silently
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
        copied && 'text-foreground',
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}
