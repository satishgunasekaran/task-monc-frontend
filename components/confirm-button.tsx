"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ConfirmButtonProps = {
  children: React.ReactNode
  onConfirm: () => Promise<void> | void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  disabled?: boolean
}

export function ConfirmButton({
  children,
  onConfirm,
  title = 'Are you sure?'
  ,
  description = 'This action cannot be undone.' ,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  className,
  disabled,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 w-[92vw] max-w-sm rounded-lg border bg-background p-4 shadow-lg">
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-none tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Working…' : confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
