import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'

interface InvoiceItem {
  name: string
  qty: number
  price: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  customerPhone: string
  items: InvoiceItem[]
  total: number
  date: string
  dueDate: string
  status: 'paid' | 'unpaid'
  notes: string
}

export default function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  // Form state
  const [customer, setCustomer] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', qty: 1, price: 0 }])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
  }, [])

  const addItem = () => {
    setItems([...items, { name: '', qty: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  const handleSubmit = () => {
    if (!customer || items.some(i => !i.name || i.price <= 0)) {
      alert('Lengkapi semua data invoice!')
      return
    }

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customer,
      customerPhone,
      items: items.filter(i => i.name),
      total,
      date: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'unpaid',
      notes,
    }

    const updated = [invoice, ...invoices]
    setInvoices(updated)
    saveToStorage('umkm_invoices', updated)
    resetForm()
  }

  const resetForm = () => {
    setCustomer('')
    setCustomerPhone('')
    setItems([{ name: '', qty: 1, price: 0 }])
    setDueDate('')
    setNotes('')
    setShowForm(false)
  }

  const toggleStatus = (id: string) => {
    const updated = invoices.map(inv =>
      inv.id === id ? { ...inv, status: inv.status === 'paid' ? 'unpaid' : 'paid' } as Invoice : inv
    )
    setInvoices(updated)
    saveToStorage('umkm_invoices', updated)
  }

  const deleteInvoice = (id: string) => {
    if (confirm('Hapus invoice ini?')) {
      const updated = invoices.filter(i => i.id !== id)
      setInvoices(updated)
      saveToStorage('umkm_invoices', updated)
    }
  }

  // Invoice Preview
  if (viewInvoice) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setViewInvoice(null)}
          className="mb-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Kembali
        </button>
        <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl" id="invoice-preview">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">INVOICE</h1>
              <p className="text-gray-500">{viewInvoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl">🚀</div>
              <p className="font-bold">UMKM Toolkit</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Kepada:</p>
              <p className="font-bold text-lg">{viewInvoice.customer}</p>
              {viewInvoice.customerPhone && <p className="text-gray-600">{viewInvoice.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Tanggal:</p>
              <p className="font-bold">{formatDate(viewInvoice.date)}</p>
              <p className="text-sm text-gray-500 mt-2">Jatuh Tempo:</p>
              <p className="font-bold">{formatDate(viewInvoice.dueDate)}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-purple-200">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Harga</th>
                <th className="text-right py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {viewInvoice.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-3">{item.name}</td>
                  <td className="text-center py-3">{item.qty}</td>
                  <td className="text-right py-3">{formatRupiah(item.price)}</td>
                  <td className="text-right py-3 font-bold">{formatRupiah(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Total</span>
                <span className="font-bold text-xl text-purple-600">{formatRupiah(viewInvoice.total)}</span>
              </div>
            </div>
          </div>

          {viewInvoice.notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Catatan:</p>
              <p className="text-gray-700">{viewInvoice.notes}</p>
            </div>
          )}

          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Status: <span className={viewInvoice.status === 'paid' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {viewInvoice.status === 'paid' ? 'LUNAS ✅' : 'BELUM DIBAYAR'}
            </span></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">🧾 Invoice Generator</h2>
          <p className="text-gray-400 mt-1">Buat invoice profesional untuk pelanggan kamu</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          {showForm ? 'Batal' : '+ Buat Invoice'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-6">
          <h3 className="text-xl font-bold">Data Invoice</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nama Pelanggan *</label>
              <input
                type="text"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Contoh: Toko Maju Jaya"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">No. Telepon</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Jatuh Tempo</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-gray-400">Item Produk *</label>
              <button onClick={addItem} className="text-sm text-purple-400 hover:text-purple-300">
                + Tambah Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)}
                    placeholder="Nama produk"
                    className="col-span-5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    value={item.qty}
                    onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    min="1"
                    className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => updateItem(i, 'price', parseInt(e.target.value) || 0)}
                    placeholder="Harga"
                    className="col-span-4 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="col-span-1 text-red-400 hover:text-red-300 text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <span className="text-gray-400">Total: </span>
              <span className="text-2xl font-bold text-purple-400">{formatRupiah(total)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/30"
          >
            💾 Simpan Invoice
          </button>
        </div>
      )}

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">🧾</div>
            <p className="text-gray-400">Belum ada invoice. Buat invoice pertamamu!</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{invoice.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {invoice.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{invoice.customer}</h4>
                  <p className="text-sm text-gray-400">{formatDate(invoice.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-400">{formatRupiah(invoice.total)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setViewInvoice(invoice)}
                  className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  👁️ Lihat
                </button>
                <button
                  onClick={() => toggleStatus(invoice.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    invoice.status === 'paid'
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {invoice.status === 'paid' ? '↩️ Belum Lunas' : '✅ Tandai Lunas'}
                </button>
                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
