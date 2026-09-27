--- src/App.tsx (原始)
import { useState } from 'react'
import Dashboard from './components/Dashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <Dashboard />
    </div>
  )
}


+++ src/App.tsx (修改后)
import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import InvoiceGenerator from './components/InvoiceGenerator'
import PriceCalculator from './components/PriceCalculator'
import CashFlowTracker from './components/CashFlowTracker'
import InventoryManager from './components/InventoryManager'
import CustomerManagement from './components/CustomerManagement'
import EnhancedAnalytics from './components/EnhancedAnalytics'
import PurchaseOrder from './components/PurchaseOrder'
import SupplierManagement from './components/SupplierManagement'
import WhatsAppShare from './components/WhatsAppShare'
import QRCodeGenerator from './components/QRCodeGenerator'
import CloudSyncUI from './components/CloudSyncUI'
import TeamManagementUI from './components/TeamManagementUI'
import AIFeaturesUI from './components/AIFeaturesUI'
import MarketplaceUI from './components/MarketplaceUI'
import ReceiptGenerator from './components/ReceiptGenerator'
import PaymentTracker from './components/PaymentTracker'
import FinancialReport from './components/FinancialReport'
import LoyaltyProgram from './components/LoyaltyProgram'
import ProductBundle from './components/ProductBundle'
import ShippingReceipt from './components/ShippingReceipt'
import POS from './components/POS'
import VoucherManager from './components/VoucherManager'
import DebtManagement from './components/DebtManagement'
import AutoReminder from './components/AutoReminder'
import EmployeeManagement from './components/EmployeeManagement'
import BarcodeScanner from './components/BarcodeScanner'
import PWAInstaller from './components/PWAInstaller'
import ComingSoon from './components/ComingSoon'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'

type Page = 'dashboard' | 'invoice' | 'calculator' | 'cashflow' | 'inventory' | 'customers' | 'analytics' | 'purchase' | 'supplier' | 'whatsapp' | 'qrcode' | 'cloud' | 'team' | 'ai' | 'marketplace' | 'receipt' | 'shipping' | 'payment' | 'report' | 'loyalty' | 'bundle' | 'pos' | 'voucher' | 'debt' | 'reminder' | 'employee' | 'barcode' | 'expedition' | 'payment-gateway' | 'wa-business'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: 'dashboard' as IconName, category: 'Overview' },
    { id: 'invoice' as Page, label: 'Invoice', icon: 'file-text' as IconName, category: 'Transaksi' },
    { id: 'receipt' as Page, label: 'Struk Penjualan', icon: 'receipt' as IconName, category: 'Transaksi' },
    { id: 'payment' as Page, label: 'Payment', icon: 'credit-card' as IconName, category: 'Transaksi' },
    { id: 'debt' as Page, label: 'Utang-Piutang', icon: 'coins' as IconName, category: 'Transaksi' },
    { id: 'reminder' as Page, label: 'Auto Reminder', icon: 'bell' as IconName, category: 'Transaksi' },
    { id: 'employee' as Page, label: 'Karyawan', icon: 'users' as IconName, category: 'Operasional' },
    { id: 'barcode' as Page, label: 'Barcode Scanner', icon: 'scan' as IconName, category: 'Operasional' },
    { id: 'cashflow' as Page, label: 'Cash Flow', icon: 'cashflow' as IconName, category: 'Keuangan' },
    { id: 'report' as Page, label: 'Laporan', icon: 'file-chart' as IconName, category: 'Keuangan' },
    { id: 'calculator' as Page, label: 'Kalkulator', icon: 'calculator' as IconName, category: 'Keuangan' },
    { id: 'shipping' as Page, label: 'Resi Pengiriman', icon: 'truck' as IconName, category: 'Pengiriman' },
    { id: 'pos' as Page, label: 'POS / Kasir', icon: 'shopping-cart' as IconName, category: 'Operasional' },
    { id: 'voucher' as Page, label: 'Voucher & Promo', icon: 'award' as IconName, category: 'Operasional' },
    { id: 'inventory' as Page, label: 'Inventory', icon: 'package' as IconName, category: 'Operasional' },
    { id: 'bundle' as Page, label: 'Bundle', icon: 'layers' as IconName, category: 'Operasional' },
    { id: 'purchase' as Page, label: 'Purchase Order', icon: 'purchase' as IconName, category: 'Operasional' },
    { id: 'supplier' as Page, label: 'Supplier', icon: 'supplier' as IconName, category: 'Operasional' },
    { id: 'customers' as Page, label: 'Pelanggan', icon: 'customers' as IconName, category: 'Relasi' },
    { id: 'loyalty' as Page, label: 'Loyalty', icon: 'star' as IconName, category: 'Relasi' },
    { id: 'analytics' as Page, label: 'Analytics', icon: 'analytics' as IconName, category: 'Analisis' },
    { id: 'whatsapp' as Page, label: 'WhatsApp', icon: 'whatsapp' as IconName, category: 'Marketing' },
    { id: 'qrcode' as Page, label: 'QR Code', icon: 'qrcode' as IconName, category: 'Marketing' },
    { id: 'cloud' as Page, label: 'Cloud Sync', icon: 'cloud' as IconName, category: 'Advanced' },
    { id: 'team' as Page, label: 'Team', icon: 'user-cog' as IconName, category: 'Advanced' },
    { id: 'ai' as Page, label: 'AI Assistant', icon: 'brain' as IconName, category: 'Advanced' },
    { id: 'marketplace' as Page, label: 'Marketplace', icon: 'store' as IconName, category: 'Advanced' },
    { id: 'expedition' as Page, label: 'Ekspedisi', icon: 'route' as IconName, category: 'Integrasi' },
    { id: 'payment-gateway' as Page, label: 'Payment GW', icon: 'credit-card' as IconName, category: 'Integrasi' },
    { id: 'wa-business' as Page, label: 'WA Business', icon: 'bot' as IconName, category: 'Integrasi' },
  ]

  const categories = ['Overview', 'Transaksi', 'Pengiriman', 'Operasional', 'Relasi', 'Analisis', 'Marketing', 'Advanced', 'Integrasi']

  const navigateTo = (page: Page) => {
    setCurrentPage(page)
  }

  // Swipe gesture - SAFE VERSION
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let isSwiping = false

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if touch is from left edge (0-50px)
      if (e.touches[0].clientX < 50) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        isSwiping = true
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const diffX = touchEndX - touchStartX
      const diffY = touchEndY - touchStartY

      // Only trigger if horizontal swipe is greater than vertical
      // This prevents conflict with vertical scrolling
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
        if (diffX > 0) {
          // Swipe right - open menu
          setSidebarOpen(true)
        } else {
          // Swipe left - close menu
          if (sidebarOpen) {
            setSidebarOpen(false)
          }
        }
      }

      isSwiping = false
      touchStartX = 0
      touchStartY = 0
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [sidebarOpen])

  // Listen for navigation events from components
  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      navigateTo(e.detail as Page)
    }
    window.addEventListener('navigate', handleNavigate as EventListener)
    return () => window.removeEventListener('navigate', handleNavigate as EventListener)
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={(page) => navigateTo(page as Page)} />
      case 'invoice': return <InvoiceGenerator />
      case 'receipt': return <ReceiptGenerator />
      case 'shipping': return <ShippingReceipt />
      case 'pos': return <POS />
      case 'voucher': return <VoucherManager />
      case 'debt': return <DebtManagement />
      case 'reminder': return <AutoReminder />
      case 'employee': return <EmployeeManagement />
      case 'barcode': return <BarcodeScanner />
      case 'payment': return <PaymentTracker />
      case 'report': return <FinancialReport />
      case 'loyalty': return <LoyaltyProgram />
      case 'bundle': return <ProductBundle />
      case 'calculator': return <PriceCalculator />
      case 'cashflow': return <CashFlowTracker />
      case 'inventory': return <InventoryManager />
      case 'customers': return <CustomerManagement />
      case 'analytics': return <EnhancedAnalytics />
      case 'purchase': return <PurchaseOrder />
      case 'supplier': return <SupplierManagement />
      case 'whatsapp': return <WhatsAppShare />
      case 'qrcode': return <QRCodeGenerator />
      case 'cloud': return <CloudSyncUI />
      case 'team': return <TeamManagementUI />
      case 'ai': return <AIFeaturesUI />
      case 'marketplace': return <MarketplaceUI />
      case 'expedition': return <ComingSoon title="Integrasi Ekspedisi" description="Integrasi dengan jasa pengiriman untuk otomatisasi resi dan tracking" icon="truck" features={['Auto-generate resi', 'Auto-calculate ongkir', 'Real-time tracking', 'Multi-kurir (JNE, J&T, SiCepat)', 'Label pengiriman otomatis', 'Notifikasi status pengiriman']} />
      case 'payment-gateway': return <ComingSoon title="Payment Gateway" description="Terima pembayaran online dari berbagai metode pembayaran" icon="credit-card" features={['Multi-payment methods', 'Auto-verify pembayaran', 'QRIS integration', 'Virtual account', 'E-wallet integration', 'Auto-reconciliation']} />
      case 'wa-business': return <ComingSoon title="WhatsApp Business API" description="Integrasi WhatsApp Business untuk otomatisasi chat dan order" icon="message-circle" features={['Auto-reply chat', 'Broadcast message', 'Order via WhatsApp', 'Catalog integration', 'Template message', 'Chat analytics']} />
      default: return <Dashboard onNavigate={(page) => navigateTo(page as Page)} />
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex" style={{ touchAction: 'pan-y' }}>
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-100 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">UMKM Toolkit</h1>
              <p className="text-xs text-slate-600">Business Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map(category => {
            const items = menuItems.filter(item => item.category === category)
            if (items.length === 0) return null

            return (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  {category}
                </p>
                <div className="space-y-1">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigateTo(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${currentPage === item.id
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }
                      `}
                    >
                      <Icon name={item.icon} size={18} filled={currentPage === item.id} />
                      <span>{item.label}</span>
                      {currentPage === item.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-1">UMKM Toolkit Pro</p>
            <p className="text-xs text-slate-700 mb-3">32 tools lengkap untuk bisnis Anda</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-700">Data tersimpan lokal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating Menu Button (Mobile Only) - Small & Unobtrusive */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 w-10 h-10 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-r-lg shadow-md hover:bg-white hover:shadow-lg transition-all flex items-center justify-center group"
            title="Buka Menu"
          >
            <Icon
              name="chevron-right"
              size={20}
              className="text-slate-600 group-hover:text-indigo-600 transition-colors"
            />
          </button>
        )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              title="Menu"
            >
              <Icon name="menu" size={20} className="text-slate-700" />
            </button>

            <div className="flex items-center gap-3">
              <Icon
                name={menuItems.find(m => m.id === currentPage)?.icon || 'dashboard'}
                size={24}
                className="text-indigo-600"
                filled
              />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {menuItems.find(m => m.id === currentPage)?.label}
                </h2>
                <p className="text-sm text-slate-600">
                  {menuItems.find(m => m.id === currentPage)?.category}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Online</span>
            </div>
          </div>
        </div>
      </header>
        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="animate-fade-in">
            {renderPage()}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 px-6 py-4 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              © 2024 UMKM Toolkit — Dibuat dengan ❤️ untuk UMKM Indonesia
            </p>
            <p className="text-xs text-slate-600">
              v5.0 • 32 Tools • All-in-One Business Solution
            </p>
          </div>
        </footer>
      </div>

      {/* PWA Installer */}
      <PWAInstaller />
    </div>
  )
}
