import { useState, useEffect } from 'react'
import { Icon } from './Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show install prompt
    deferredPrompt.prompt()

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted install prompt')
      setIsInstalled(true)
    } else {
      console.log('User dismissed install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Check if dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  if (isInstalled || !showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Icon name="download" size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Install UMKM Toolkit</h3>
          <p className="text-sm text-slate-600 mb-4">
            Pasang aplikasi di HP Anda untuk akses cepat dan fitur offline!
          </p>
          <div className="flex gap-2">
            <button onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm">
              Install Sekarang
            </button>
            <button onClick={handleDismiss}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm">
              Nanti
            </button>
          </div>
        </div>
        <button onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Icon name="check-circle" size={14} className="text-emerald-500" />
          <span>Akses cepat dari home screen</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <Icon name="check-circle" size={14} className="text-emerald-500" />
          <span>Bisa digunakan offline</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <Icon name="check-circle" size={14} className="text-emerald-500" />
          <span>Tanpa iklan & lebih cepat</span>
        </div>
      </div>
    </div>
  )
}
