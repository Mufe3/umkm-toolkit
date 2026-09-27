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
  const [showManualGuide, setShowManualGuide] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        return
      }
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

    // Show manual guide after 3 seconds if auto-install not available
    const timer = setTimeout(() => {
      if (!showInstallPrompt && !isInstalled) {
        setShowManualGuide(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [showInstallPrompt, isInstalled])

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
    setShowManualGuide(false)
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled) return null

  // Auto-install prompt (when browser supports it)
  if (showInstallPrompt && deferredPrompt) {
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

  // Manual install guide (fallback)
  if (showManualGuide) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Icon name="download" size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Install UMKM Toolkit</h3>
            <p className="text-sm text-slate-600 mb-4">
              Pasang aplikasi di HP Anda untuk akses cepat!
            </p>
            
            {isIOS ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold">Cara Install di iPhone:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Tap tombol <strong>Share</strong> (📤) di Safari</li>
                  <li>Scroll & tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong></li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold">Cara Install di Android:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Tap <strong>menu (⋮)</strong> di Chrome</li>
                  <li>Pilih <strong>"Install app"</strong> atau <strong>"Add to Home screen"</strong></li>
                  <li>Tap <strong>"Install"</strong></li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold">Cara Install di Desktop:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Klik <strong>icon install (⊕)</strong> di address bar</li>
                  <li>Atau tap <strong>menu (⋮)</strong> → <strong>"Install UMKM Toolkit"</strong></li>
                </ol>
              </div>
            )}

            <button onClick={handleDismiss}
              className="mt-4 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm">
              Tutup
            </button>
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

  return null
}
