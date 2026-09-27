import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import { Icon } from './Icon'

interface Invoice {
  id: string
  invoiceNumber?: string
  customer: string
  customerPhone?: string
  total: number
  date: string
  status: 'paid' | 'unpaid'
  items: Array<{ name: string; qty: number; price: number }>
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  category: string
}

export default function WhatsAppShare() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tab, setTab] = useState<'invoice' | 'catalog'>('invoice')
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
    setProducts(getFromStorage<Product[]>('umkm_products', []))
    
    // Check for quick action from customer profile
    const quickAction = getFromStorage<any>('umkm_quick_action', null)
    if (quickAction && quickAction.type === 'whatsapp') {
      // Auto-fill customer phone for WhatsApp
      const phone = quickAction.customerPhone || ''
      if (phone) {
        // Find unpaid invoices for this customer
        const customerInvoices = invoices.filter(i => 
          i.customer === quickAction.customerName && i.status === 'unpaid'
        )
        
        if (customerInvoices.length > 0) {
          // Auto-select first unpaid invoice
          const invoice = customerInvoices[0]
          const message = generateInvoiceMessage(invoice)
          
          // Open WhatsApp directly
          let cleanPhone = phone.replace(/[^0-9]/g, '')
          if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1)
          if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone
          
          const encoded = encodeURIComponent(message)
          window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
        } else {
          // No unpaid invoice, just open WhatsApp with greeting
          let cleanPhone = phone.replace(/[^0-9]/g, '')
          if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1)
          if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone
          
          const greeting = `Halo *${quickAction.customerName}*! 👋\n\nAda yang bisa kami bantu?`
          const encoded = encodeURIComponent(greeting)
          window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
        }
      }
      localStorage.removeItem('umkm_quick_action')
    }
  }, [invoices])

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')

  const generateInvoiceMessage = (invoice: Invoice): string => {
    const invNum = invoice.invoiceNumber || invoice.id.slice(-6)
    let msg = `🧾 *INVOICE ${invNum}*\n\n`
    msg += `Halo *${invoice.customer}*! 👋\n\n`
    msg += `Berikut rincian invoice Anda:\n\n`
    msg += `━━━━━━━━━━━━━━━\n`
    invoice.items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name}\n`
      msg += `   ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.qty * item.price)}\n`
    })
    msg += `━━━━━━━━━━━━━━━\n\n`
    msg += `💰 *TOTAL: ${formatRupiah(invoice.total)}*\n\n`
    if (customMessage) {
      msg += `📝 ${customMessage}\n\n`
    }
    msg += `Terima kasih atas kepercayaan Anda! 🙏`
    return msg
  }

  const generateCatalogMessage = (): string => {
    let msg = `🛍️ *KATALOG PRODUK KAMI*\n\n`
    msg += `Halo! Berikut daftar produk yang tersedia:\n\n`
    msg += `━━━━━━━━━━━━━━━\n\n`

    const categories = [...new Set(products.map(p => p.category))]
    categories.forEach(cat => {
      msg += `📁 *${cat || 'Lainnya'}*\n`
      products.filter(p => p.category === cat).forEach(p => {
        msg += `• ${p.name} - ${formatRupiah(p.price)}/${p.unit}\n`
        if (p.stock <= 5 && p.stock > 0) {
          msg += `  ⚠️ Stok tersisa: ${p.stock} ${p.unit}\n`
        } else if (p.stock === 0) {
          msg += `  ❌ Stok habis\n`
        }
      })
      msg += `\n`
    })

    msg += `━━━━━━━━━━━━━━━\n\n`
    if (customMessage) {
      msg += `📝 ${customMessage}\n\n`
    }
    msg += `📲 Hubungi kami untuk pemesanan!\n`
    msg += `Terima kasih! 🙏`
    return msg
  }

  const openWhatsApp = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1)
    }
    if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone
    }

    const encoded = encodeURIComponent(message)
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`
    window.open(url, '_blank')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Pesan berhasil disalin! Paste di WhatsApp.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">WhatsApp Integration</h2>
        <p className="text-slate-500 mt-1">Kirim invoice & katalog langsung via WhatsApp</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        <button onClick={() => setTab('invoice')}
          className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'invoice' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Icon name="invoice" size={16} /> Kirim Invoice
        </button>
        <button onClick={() => setTab('catalog')}
          className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'catalog' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Icon name="package" size={16} /> Share Katalog
        </button>
      </div>

      {/* Custom Message */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <label className="text-sm text-slate-600 mb-2 block flex items-center gap-1">
          <Icon name="edit" size={14} /> Pesan Tambahan (Opsional)
        </label>
        <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
          placeholder="Tambahkan pesan khusus..."
          rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
      </div>

      {tab === 'invoice' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Icon name="invoice" size={18} className="text-indigo-500" />
            Invoice Belum Dibayar ({unpaidInvoices.length})
          </h3>
          {unpaidInvoices.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
              <div className="mb-4">
                <Icon name="check-circle" size={48} className="text-emerald-500 mx-auto" />
              </div>
              <p className="text-slate-500">Semua invoice sudah lunas!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.map(invoice => (
                <div key={invoice.id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800">{invoice.customer}</h4>
                      <p className="text-sm text-slate-500">
                        {invoice.invoiceNumber || `#${invoice.id.slice(-6)}`} • {formatRupiah(invoice.total)}
                      </p>
                      {invoice.customerPhone && (
                        <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                          <Icon name="phone" size={12} /> {invoice.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preview Message */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-500 mb-2">Preview Pesan:</p>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                      {generateInvoiceMessage(invoice)}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    {invoice.customerPhone ? (
                      <button
                        onClick={() => openWhatsApp(invoice.customerPhone!, generateInvoiceMessage(invoice))}
                        className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="phone" size={16} /> Kirim via WhatsApp
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const phone = prompt('Masukkan nomor WhatsApp pelanggan:')
                          if (phone) openWhatsApp(phone, generateInvoiceMessage(invoice))
                        }}
                        className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Icon name="phone" size={16} /> Masukkan Nomor WA
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(generateInvoiceMessage(invoice))}
                      className="px-4 py-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-700"
                    >
                      <Icon name="download" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Icon name="package" size={18} className="text-indigo-500" />
            Katalog Produk ({products.length} produk)
          </h3>
          {products.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
              <div className="mb-4">
                <Icon name="package" size={48} className="text-slate-300 mx-auto" />
              </div>
              <p className="text-slate-500">Belum ada produk. Tambah produk di menu Inventory dulu!</p>
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-500 mb-2">Preview Katalog:</p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                  {generateCatalogMessage()}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const phone = prompt('Masukkan nomor WhatsApp tujuan:')
                    if (phone) openWhatsApp(phone, generateCatalogMessage())
                  }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="phone" size={16} /> Share via WhatsApp
                </button>
                <button
                  onClick={() => copyToClipboard(generateCatalogMessage())}
                  className="px-4 py-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-700"
                >
                  <Icon name="download" size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
        <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
          <Icon name="info" size={16} /> Tips WhatsApp Marketing
        </h4>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>• Kirim invoice reminder setiap 3 hari sekali</li>
          <li>• Share katalog ke grup pelanggan setia</li>
          <li>• Gunakan pesan personal untuk pelanggan VIP</li>
          <li>• Kirim promo spesial di hari raya/event</li>
          <li>• Follow up pelanggan yang sudah lama tidak order</li>
        </ul>
      </div>
    </div>
  )
}
