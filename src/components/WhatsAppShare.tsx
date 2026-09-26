import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'

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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
    setProducts(getFromStorage<Product[]>('umkm_products', []))
  }, [])

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')

  // Generate WhatsApp message for invoice
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

  // Generate WhatsApp message for catalog
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

  // Open WhatsApp with message
  const openWhatsApp = (phone: string, message: string) => {
    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    // Convert 08xxx to 628xxx
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
        <h2 className="text-3xl font-bold">📱 WhatsApp Integration</h2>
        <p className="text-gray-400 mt-1">Kirim invoice & katalog langsung via WhatsApp</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden w-fit">
        <button onClick={() => setTab('invoice')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${tab === 'invoice' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🧾 Kirim Invoice
        </button>
        <button onClick={() => setTab('catalog')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${tab === 'catalog' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🛍️ Share Katalog
        </button>
      </div>

      {/* Custom Message */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <label className="text-sm text-gray-400 mb-2 block">📝 Pesan Tambahan (Opsional)</label>
        <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
          placeholder="Tambahkan pesan khusus..."
          rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none resize-none" />
      </div>

      {tab === 'invoice' ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Invoice Belum Dibayar ({unpaidInvoices.length})</h3>
          {unpaidInvoices.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-gray-400">Semua invoice sudah lunas!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.map(invoice => (
                <div key={invoice.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold">{invoice.customer}</h4>
                      <p className="text-sm text-gray-400">
                        {invoice.invoiceNumber || `#${invoice.id.slice(-6)}`} • {formatRupiah(invoice.total)}
                      </p>
                      {invoice.customerPhone && (
                        <p className="text-sm text-green-400 mt-1">📱 {invoice.customerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Preview Message */}
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Preview Pesan:</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                      {generateInvoiceMessage(invoice)}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    {invoice.customerPhone ? (
                      <button
                        onClick={() => openWhatsApp(invoice.customerPhone!, generateInvoiceMessage(invoice))}
                        className="flex-1 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📱</span> Kirim via WhatsApp
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const phone = prompt('Masukkan nomor WhatsApp pelanggan:')
                          if (phone) openWhatsApp(phone, generateInvoiceMessage(invoice))
                        }}
                        className="flex-1 py-3 bg-green-600/50 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📱</span> Masukkan Nomor WA
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(generateInvoiceMessage(invoice))}
                      className="px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Katalog Produk ({products.length} produk)</h3>
          {products.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="text-gray-400">Belum ada produk. Tambah produk di menu Inventory dulu!</p>
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Preview Katalog:</p>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                  {generateCatalogMessage()}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const phone = prompt('Masukkan nomor WhatsApp tujuan:')
                    if (phone) openWhatsApp(phone, generateCatalogMessage())
                  }}
                  className="flex-1 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📱</span> Share via WhatsApp
                </button>
                <button
                  onClick={() => copyToClipboard(generateCatalogMessage())}
                  className="px-4 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-green-900/20 rounded-xl p-5 border border-green-500/30">
        <h4 className="font-bold text-green-400 mb-2">💡 Tips WhatsApp Marketing</h4>
        <ul className="text-sm text-gray-300 space-y-1">
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
