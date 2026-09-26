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

type Page = 'dashboard' | 'invoice' | 'calculator' | 'cashflow' | 'inventory' | 'customers' | 'analytics' | 'purchase' | 'supplier' | 'whatsapp' | 'qrcode'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
    { id: 'invoice' as Page, label: 'Invoice', icon: '🧾' },
    { id: 'calculator' as Page, label: 'Kalkulator', icon: '🧮' },
    { id: 'cashflow' as Page, label: 'Cash Flow', icon: '💰' },
    { id: 'inventory' as Page, label: 'Inventory', icon: '📦' },
    { id: 'customers' as Page, label: 'Pelanggan', icon: '👥' },
    { id: 'analytics' as Page, label: 'Analytics', icon: '📈' },
    { id: 'purchase' as Page, label: 'Purchase', icon: '📋' },
    { id: 'supplier' as Page, label: 'Supplier', icon: '🏭' },
    { id: 'whatsapp' as Page, label: 'WhatsApp', icon: '📱' },
    { id: 'qrcode' as Page, label: 'QR Code', icon: '🏷️' },
  ]

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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚀</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                UMKM Toolkit
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">All-in-one tools untuk bisnis kamu</p>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop menu */}
          <nav className="hidden md:flex gap-0.5 overflow-x-auto max-w-[calc(100vw-200px)]">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-2.5 py-1.5 rounded-lg transition-all text-xs whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-800 px-4 py-2 max-h-[70vh] overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id)
                  setMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <p>UMKM Toolkit © 2024 - 11 Tools Lengkap untuk UMKM Indonesia 🇮🇩</p>
      </footer>
    </div>
  )
}
