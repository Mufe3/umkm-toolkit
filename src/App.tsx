import { useState } from 'react'
import Dashboard from './components/Dashboard'
import InvoiceGenerator from './components/InvoiceGenerator'
import PriceCalculator from './components/PriceCalculator'
import CashFlowTracker from './components/CashFlowTracker'
import InventoryManager from './components/InventoryManager'
import CustomerManagement from './components/CustomerManagement'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import PurchaseOrder from './components/PurchaseOrder'
import SupplierManagement from './components/SupplierManagement'
import WhatsAppShare from './components/WhatsAppShare'
import QRCodeGenerator from './components/QRCodeGenerator'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'

type Page = 'dashboard' | 'invoice' | 'calculator' | 'cashflow' | 'inventory' | 'customers' | 'analytics' | 'purchase' | 'supplier' | 'whatsapp' | 'qrcode'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: 'dashboard' as IconName, category: 'Overview' },
    { id: 'invoice' as Page, label: 'Invoice', icon: 'invoice' as IconName, category: 'Keuangan' },
    { id: 'cashflow' as Page, label: 'Cash Flow', icon: 'cashflow' as IconName, category: 'Keuangan' },
    { id: 'calculator' as Page, label: 'Kalkulator Harga', icon: 'calculator' as IconName, category: 'Keuangan' },
    { id: 'inventory' as Page, label: 'Inventory', icon: 'inventory' as IconName, category: 'Operasional' },
    { id: 'purchase' as Page, label: 'Purchase Order', icon: 'purchase' as IconName, category: 'Operasional' },
    { id: 'supplier' as Page, label: 'Supplier', icon: 'supplier' as IconName, category: 'Operasional' },
    { id: 'customers' as Page, label: 'Pelanggan', icon: 'customers' as IconName, category: 'Relasi' },
    { id: 'analytics' as Page, label: 'Analytics', icon: 'analytics' as IconName, category: 'Analisis' },
    { id: 'whatsapp' as Page, label: 'WhatsApp', icon: 'whatsapp' as IconName, category: 'Marketing' },
    { id: 'qrcode' as Page, label: 'QR Code', icon: 'qrcode' as IconName, category: 'Marketing' },
  ]

  const categories = ['Overview', 'Keuangan', 'Operasional', 'Relasi', 'Analisis', 'Marketing']

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'invoice': return <InvoiceGenerator />
      case 'calculator': return <PriceCalculator />
      case 'cashflow': return <CashFlowTracker />
      case 'inventory': return <InventoryManager />
      case 'customers': return <CustomerManagement />
      case 'analytics': return <AdvancedAnalytics />
      case 'purchase': return <PurchaseOrder />
      case 'supplier': return <SupplierManagement />
      case 'whatsapp': return <WhatsAppShare />
      case 'qrcode': return <QRCodeGenerator />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex">
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
                        setCurrentPage(item.id)
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
            <p className="text-xs text-slate-700 mb-3">11 tools lengkap untuk bisnis Anda</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-700">Data tersimpan lokal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
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
              v2.0 • 11 Tools • All-in-One Business Solution
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
