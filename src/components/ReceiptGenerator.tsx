import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

interface Receipt {
  id: string
  receiptNumber: string
  storeName: string
  storeAddress: string
  storePhone: string
  customerName: string
  customerId?: string
  items: Array<{ name: string; qty: number; price: number }>
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  date: string
  notes: string
}

export default function ReceiptGenerator() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Toko Saya',
    storeAddress: '',
    storePhone: '',
  })

  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<Array<{ name: string; qty: number; price: number }>>([{ name: '', qty: 1, price: 0 }])
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setReceipts(getFromStorage<Receipt[]>('umkm_receipts', []))
    setCustomers(getFromStorage<Customer[]>('umkm_customers', []))
    const saved = getFromStorage<typeof storeSettings>('umkm_store_settings', storeSettings)
    setStoreSettings(saved)
  }, [])

  const selectCustomer = (cust: Customer) => {
    setCustomerName(cust.name)
    setCustomerId(cust.id)
    setShowCustomerPicker(false)
  }

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discountAmount = subtotal * (discount / 100)
  const taxAmount = (subtotal - discountAmount) * (tax / 100)
  const total = subtotal - discountAmount + taxAmount

  const handleSubmit = () => {
    if (!customerName || items.some(i => !i.name || i.price <= 0)) {
      alert('Lengkapi semua data struk!')
      return
    }
    const receipt: Receipt = {
      id: generateId(),
      receiptNumber: `STRUK-${Date.now().toString().slice(-6)}`,
      ...storeSettings,
      customerName,
      customerId: customerId || undefined,
      items: items.filter(i => i.name),
      subtotal, discount: discountAmount, tax: taxAmount, total,
      paymentMethod, date: new Date().toISOString(), notes,
    }
    const updated = [receipt, ...receipts]
    setReceipts(updated)
    saveToStorage('umkm_receipts', updated)
    resetForm()
  }

  const resetForm = () => {
    setCustomerName(''); setCustomerId(''); setItems([{ name: '', qty: 1, price: 0 }])
    setDiscount(0); setTax(0); setPaymentMethod('Cash'); setNotes('')
    setShowForm(false); setShowCustomerPicker(false)
  }

  const deleteReceipt = (id: string) => {
    if (confirm('Hapus struk ini?')) {
      const updated = receipts.filter(r => r.id !== id)
      setReceipts(updated)
      saveToStorage('umkm_receipts', updated)
    }
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('receipt-preview')
    if (!element) return
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] })
    const pdfWidth = 80
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${viewReceipt?.receiptNumber || 'struk'}.pdf`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveStoreSettings = () => {
    saveToStorage('umkm_store_settings', storeSettings)
    alert('Pengaturan toko tersimpan!')
  }

  // Handle create shipping receipt from sales receipt
  const handleCreateShipping = () => {
    if (!viewReceipt) return
    
    // Store receipt data in localStorage for ShippingReceipt to use
    const shippingData = {
      customerName: viewReceipt.customerName,
      items: viewReceipt.items,
      totalAmount: viewReceipt.total,
      receiptId: viewReceipt.id,
      receiptNumber: viewReceipt.receiptNumber,
    }
    saveToStorage('umkm_shipping_from_receipt', shippingData)
    
    // Navigate to shipping receipt page
    // We'll use a custom event to trigger navigation
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'shipping' }))
  }

  if (viewReceipt) {
    return (
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setViewReceipt(null)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
            <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
          </button>
          <button onClick={handleExportPDF}
            className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2">
            <Icon name="download" size={16} /> Export PDF
          </button>
          <button onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2">
            <Icon name="print" size={16} /> Print
          </button>
          <button onClick={handleCreateShipping}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-2">
            <Icon name="truck" size={16} /> Buat Resi Pengiriman
          </button>
        </div>
        <div id="receipt-preview" className="bg-white border border-slate-200 shadow-sm font-mono" style={{ width: '80mm', padding: '3mm', fontSize: '10px' }}>
          <div className="text-center mb-2 pb-2 border-b border-dashed border-slate-300">
            <h2 className="text-sm font-bold text-slate-900">{viewReceipt.storeName}</h2>
            {viewReceipt.storeAddress && <p className="text-[9px] text-slate-600 leading-tight">{viewReceipt.storeAddress}</p>}
            {viewReceipt.storePhone && <p className="text-[9px] text-slate-600">Telp: {viewReceipt.storePhone}</p>}
          </div>
          <div className="mb-2 pb-2 border-b border-dashed border-slate-300">
            <p className="text-[9px] text-slate-600">No: {viewReceipt.receiptNumber}</p>
            <p className="text-[9px] text-slate-600">Tanggal: {formatDate(viewReceipt.date)}</p>
            <p className="text-[9px] text-slate-600">Customer: {viewReceipt.customerName}</p>
            <p className="text-[9px] text-slate-600">Bayar: {viewReceipt.paymentMethod}</p>
          </div>
          <div className="mb-2 pb-2 border-b border-dashed border-slate-300">
            {viewReceipt.items.map((item, i) => (
              <div key={i} className="mb-1">
                <p className="text-[10px] text-slate-800 leading-tight">{item.name}</p>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>{item.qty} x {formatRupiah(item.price)}</span>
                  <span>{formatRupiah(item.qty * item.price)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 mb-2">
            <div className="flex justify-between text-[9px]"><span className="text-slate-600">Subtotal</span><span>{formatRupiah(viewReceipt.subtotal)}</span></div>
            {viewReceipt.discount > 0 && <div className="flex justify-between text-[9px]"><span className="text-slate-600">Diskon</span><span className="text-rose-600">-{formatRupiah(viewReceipt.discount)}</span></div>}
            {viewReceipt.tax > 0 && <div className="flex justify-between text-[9px]"><span className="text-slate-600">Pajak</span><span>{formatRupiah(viewReceipt.tax)}</span></div>}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300"><span>TOTAL</span><span>{formatRupiah(viewReceipt.total)}</span></div>
          </div>
          {viewReceipt.notes && <p className="text-[9px] text-slate-600 text-center italic">{viewReceipt.notes}</p>}
          <p className="text-[9px] text-slate-500 text-center mt-2">Terima kasih atas kunjungan Anda!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Struk & Resi Custom</h2>
          <p className="text-slate-600 mt-1">Buat struk belanja custom untuk pelanggan Anda</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Buat Struk'}
        </button>
      </div>

      {/* Store Settings */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="settings" size={18} className="text-indigo-500" /> Pengaturan Toko
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Nama Toko</label>
            <input type="text" value={storeSettings.storeName} onChange={e => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Alamat</label>
            <input type="text" value={storeSettings.storeAddress} onChange={e => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Telepon</label>
            <input type="text" value={storeSettings.storePhone} onChange={e => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>
        </div>
        <button onClick={handleSaveStoreSettings}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2">
          <Icon name="download" size={16} /> Simpan Pengaturan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Buat Struk Baru</h3>
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-600">Nama Pelanggan *</label>
              {customers.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                  className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                >
                  <Icon name="users" size={14} /> Pilih dari Database
                </button>
              )}
            </div>
            
            {/* Customer Picker Modal */}
            {showCustomerPicker && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-semibold text-indigo-700 mb-3">Pilih Pelanggan:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map(cust => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => selectCustomer(cust)}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <p className="font-semibold text-slate-800">{cust.name}</p>
                      <p className="text-sm text-slate-600">{cust.phone}</p>
                      {cust.address && <p className="text-xs text-slate-500 mt-1">{cust.address}</p>}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCustomerPicker(false)}
                  className="mt-3 text-sm text-slate-600 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>
            )}
            
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-600">Item *</label>
              <button onClick={() => setItems([...items, { name: '', qty: 1, price: 0 }])}
                className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n) }}
                    placeholder="Nama produk" className="col-span-5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.qty} onChange={e => { const n = [...items]; n[i].qty = parseInt(e.target.value) || 0; setItems(n) }}
                    placeholder="Qty" min="1" className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.price || ''} onChange={e => { const n = [...items]; n[i].price = parseInt(e.target.value) || 0; setItems(n) }}
                    placeholder="Harga" className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-400 text-xl">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Diskon (%)</label>
              <input type="number" value={discount || ''} onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Pajak (%)</label>
              <input type="number" value={tax || ''} onChange={e => setTax(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Metode Bayar</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option>Cash</option><option>Transfer</option><option>E-Wallet</option><option>QRIS</option><option>Kartu Kredit</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Opsional" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <div className="text-right bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Subtotal:</span><span className="text-slate-800">{formatRupiah(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Diskon:</span><span className="text-rose-600">-{formatRupiah(discountAmount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Pajak:</span><span className="text-slate-800">{formatRupiah(taxAmount)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200"><span>Total:</span><span className="text-indigo-600">{formatRupiah(total)}</span></div>
          </div>
          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan Struk
          </button>
        </div>
      )}

      {/* Receipt List */}
      <div className="space-y-3">
        {receipts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="invoice" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada struk. Buat struk pertamamu!</p>
          </div>
        ) : (
          receipts.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-500">{r.receiptNumber}</span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">{r.paymentMethod}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">{r.customerName}</h4>
                  <p className="text-sm text-slate-500">{formatDate(r.date)} • {r.items.length} item</p>
                </div>
                <p className="text-xl font-bold text-indigo-600">{formatRupiah(r.total)}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setViewReceipt(r)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1">
                  <Icon name="eye" size={14} /> Lihat
                </button>
                <button onClick={() => deleteReceipt(r.id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1">
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
