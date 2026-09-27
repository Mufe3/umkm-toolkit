import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Icon } from './Icon'

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
  relatedReceiptId?: string // Link ke Struk saat lunas
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
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice) return

    const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid'
    
    // Jika status berubah ke 'paid', auto-generate Struk
    if (newStatus === 'paid' && !invoice.relatedReceiptId) {
      const receiptId = generateId()
      const storeSettings = getFromStorage<any>('umkm_store_settings', {
        storeName: 'Toko Saya',
        storeAddress: '',
        storePhone: '',
      })
      
      const receipt: any = {
        id: receiptId,
        receiptNumber: `STRUK-${Date.now().toString().slice(-6)}`,
        storeName: storeSettings.storeName,
        storeAddress: storeSettings.storeAddress,
        storePhone: storeSettings.storePhone,
        customerName: invoice.customer,
        items: invoice.items,
        subtotal: invoice.total,
        discount: 0,
        tax: 0,
        total: invoice.total,
        paymentMethod: 'Transfer (dari Invoice)',
        date: new Date().toISOString(),
        notes: `Otomatis dari Invoice ${invoice.invoiceNumber}`,
        relatedInvoiceId: invoice.id,
      }
      
      const receipts = getFromStorage<any[]>('umkm_receipts', [])
      const updatedReceipts = [receipt, ...receipts]
      saveToStorage('umkm_receipts', updatedReceipts)
      
      // Update invoice dengan relatedReceiptId
      const updated = invoices.map(inv =>
        inv.id === id ? { ...inv, status: newStatus, relatedReceiptId: receiptId } as Invoice : inv
      )
      setInvoices(updated)
      saveToStorage('umkm_invoices', updated)
      
      alert(`Invoice dilunasi! Struk #${receipt.receiptNumber} otomatis dibuat.`)
    } else {
      const updated = invoices.map(inv =>
        inv.id === id ? { ...inv, status: newStatus } as Invoice : inv
      )
      setInvoices(updated)
      saveToStorage('umkm_invoices', updated)
    }
  }

  const deleteInvoice = (id: string) => {
    if (confirm('Hapus invoice ini?')) {
      const updated = invoices.filter(i => i.id !== id)
      setInvoices(updated)
      saveToStorage('umkm_invoices', updated)
    }
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('invoice-preview')
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${viewInvoice?.invoiceNumber || 'invoice'}.pdf`)
  }

  // Handle create shipping receipt from invoice
  const handleCreateShippingFromInvoice = () => {
    if (!viewInvoice) return
    
    // Store invoice data in localStorage for ShippingReceipt to use
    const shippingData = {
      customerName: viewInvoice.customer,
      customerPhone: viewInvoice.customerPhone,
      items: viewInvoice.items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        weight: 1, // Default weight, user can adjust
      })),
      totalAmount: viewInvoice.total,
      invoiceId: viewInvoice.id,
      invoiceNumber: viewInvoice.invoiceNumber,
    }
    saveToStorage('umkm_shipping_from_invoice', shippingData)
    
    // Navigate to shipping receipt page
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'shipping' }))
  }

  // Invoice Preview
  if (viewInvoice) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewInvoice(null)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2"
          >
            <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2"
          >
            <Icon name="download" size={16} /> Export PDF
          </button>
          <button
            onClick={handleCreateShippingFromInvoice}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2"
          >
            <Icon name="truck" size={16} /> Buat Resi Pengiriman
          </button>
        </div>
        <div className="bg-white text-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100" id="invoice-preview">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-indigo-500">INVOICE</h1>
              <p className="text-slate-500">{viewInvoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <p className="font-semibold text-slate-700">UMKM Toolkit</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm text-slate-500 mb-1">Kepada:</p>
              <p className="font-semibold text-lg text-slate-800">{viewInvoice.customer}</p>
              {viewInvoice.customerPhone && <p className="text-slate-600">{viewInvoice.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Tanggal:</p>
              <p className="font-semibold text-slate-800">{formatDate(viewInvoice.date)}</p>
              <p className="text-sm text-slate-500 mt-2">Jatuh Tempo:</p>
              <p className="font-semibold text-slate-800">{formatDate(viewInvoice.dueDate)}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 text-slate-500 text-xs uppercase tracking-wider">Item</th>
                <th className="text-center py-2 text-slate-500 text-xs uppercase tracking-wider">Qty</th>
                <th className="text-right py-2 text-slate-500 text-xs uppercase tracking-wider">Harga</th>
                <th className="text-right py-2 text-slate-500 text-xs uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {viewInvoice.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-700">{item.name}</td>
                  <td className="text-center py-3 text-slate-600">{item.qty}</td>
                  <td className="text-right py-3 text-slate-600">{formatRupiah(item.price)}</td>
                  <td className="text-right py-3 font-semibold text-slate-800">{formatRupiah(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-xl text-indigo-500">{formatRupiah(viewInvoice.total)}</span>
              </div>
            </div>
          </div>

          {viewInvoice.notes && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Catatan:</p>
              <p className="text-slate-700">{viewInvoice.notes}</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              viewInvoice.status === 'paid' 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-rose-50 text-rose-600'
            }`}>
              {viewInvoice.status === 'paid' ? '✓ LUNAS' : 'BELUM DIBAYAR'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice Generator</h2>
          <p className="text-slate-500 mt-1">Buat invoice profesional untuk pelanggan Anda</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-400 to-violet-400 text-white rounded-lg font-medium hover:shadow-md hover:shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Buat Invoice'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-semibold text-slate-800">Data Invoice</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama Pelanggan *</label>
              <input
                type="text"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Contoh: Toko Maju Jaya"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">No. Telepon</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Jatuh Tempo</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-600">Item Produk *</label>
              <button onClick={addItem} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Item
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
                    className="col-span-5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800"
                  />
                  <input
                    type="number"
                    value={item.qty}
                    onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    min="1"
                    className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => updateItem(i, 'price', parseInt(e.target.value) || 0)}
                    placeholder="Harga"
                    className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="col-span-1 text-rose-400 hover:text-rose-500 text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <span className="text-slate-500">Total: </span>
              <span className="text-2xl font-bold text-indigo-500">{formatRupiah(total)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-indigo-400 to-violet-400 text-white rounded-lg font-medium hover:shadow-md hover:shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="check" size={18} /> Simpan Invoice
          </button>
        </div>
      )}

      {/* Invoice List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="invoice" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">Belum ada invoice. Buat invoice pertamamu!</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-500">{invoice.invoiceNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {invoice.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800">{invoice.customer}</h4>
                  <p className="text-sm text-slate-500">{formatDate(invoice.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-indigo-500">{formatRupiah(invoice.total)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setViewInvoice(invoice)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                  <Icon name="eye" size={14} /> Lihat
                </button>
                <button
                  onClick={() => toggleStatus(invoice.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    invoice.status === 'paid'
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  <Icon name={invoice.status === 'paid' ? 'x-circle' : 'check-circle'} size={14} />
                  {invoice.status === 'paid' ? 'Belum Lunas' : 'Tandai Lunas'}
                </button>
                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Icon name="trash" size={14} /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
