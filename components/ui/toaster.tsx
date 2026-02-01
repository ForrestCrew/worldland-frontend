'use client'

import { Toaster as SonnerToaster } from 'sonner'

/**
 * Toaster component for displaying toast notifications.
 *
 * Configuration per CONTEXT.md decisions:
 * - Position: top-right
 * - Max visible: 3 (oldest dismissed when 4th appears)
 * - Auto-dismiss: 4 seconds (within 3-5 second range)
 * - Close button on all toasts
 * - Color-coded by type (richColors)
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      visibleToasts={3}
      duration={4000}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
          title: 'font-medium',
          description: 'text-sm opacity-90',
        },
      }}
    />
  )
}
