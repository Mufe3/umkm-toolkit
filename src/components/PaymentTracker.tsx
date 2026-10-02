import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  customerId?: string
  total: number
  status: 'paid' | 'unpaid'
  dueDate: string
}

interface Payment {
  id: string
  invoiceId?: string
  customerId?: string
  customerName: string
  amount: number
  method: 'cash' | 'transfer' | 'ewallet' | 'qris' | 'credit'
  reference: string
  status: 'pending' | 'verified' | 'failed'
  date: string
  notes: string
}

export default function PaymentTracker() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<string>('')

  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<Payment['method']>('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setPayments(getFromStorage<Payment[]>('umkm_payments', []))
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
    setCustomers(getFromStorage<any[]>('umkm_customers', []))
  }, [])

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoice(invoiceId)
    if (invoiceId) {
      const invoice = invoices.find(i => i.id === invoiceId)
      if (invoice) {
        setCustomerName(invoice.customer)
        setCustomerId(invoice.customerId || '')
        setAmount(invoice.total)
      }
    } else {
      setCustomerName('')
      setCustomerId('')
      setAmount(0)
    }
  }

  const handleSubmit = () => {
    if (!customerName || !amount) {
      alert('Lengkapi data pembayaran!')
      return
    }

    const payment: Payment = {
      id: generateId(),
      invoiceId: selectedInvoice || undefined,
      customerId: customerId || undefined,
      customerName,
      amount,
      method,
      reference,
      status: method === 'cash' ? 'verified' : 'pending',
      date: new Date().toISOString(),
      notes,
    }

    const updated = [payment, ...payments]
    setPayments(updated)
    saveToStorage('umkm_payments', updated)

    // AUTO-SYNC: If payment is verified and linked to invoice
    if (payment.status === 'verified' && payment.invoiceId) {
      // Update invoice status to paid
      const updatedInvoices = invoices.map(inv =>
        inv.id === payment.invoiceId ? { ...inv, status: 'paid' as const } : inv
      )
      setInvoices(updatedInvoices)
      saveToStorage('umkm_invoices', updatedInvoices)

      // Create Cash Flow entry
      const transactions = getFromStorage<any[]>('umkm_transactions', [])
      const newTransaction = {
        id: generateId(),
        type: 'income',
        amount: payment.amount,
        category: 'Pembayaran Invoice',
        description: `Payment #${payment.reference || payment.id.slice(-6)} - ${payment.customerName}`,
        date: payment.date,
        customerId: payment.customerId,
      }
      saveToStorage('umkm_transactions', [newTransaction, ...transactions])

      // Auto-earn Loyalty points
      if (payment.customerId) {
        const loyaltyMembers = getFromStorage<any[]>('umkm_loyalty_members', [])
        const member = loyaltyMembers.find((m: any) => m.id === payment.customerId)
        if (member) {
          const earnedPoints = Math.floor(payment.amount / 10000)
          member.points += earnedPoints
          member.totalSpent += payment.amount
          
          if (member.totalSpent >= 10000000) member.tier = 'platinum'
          else if (member.totalSpent >= 5000000) member.tier = 'gold'
          else if (member.totalSpent >= 2000000) member.tier = 'silver'
          
          saveToStorage('umkm_loyalty_members', loyaltyMembers)
        }
      }

      // Auto-generate Struk
      const storeSettings = getFromStorage<any>('umkm_store_settings', {
        storeName: 'Toko Saya',
        storeAddress: '',
        storePhone: '',
      })
      
      const invoice = invoices.find(i => i.id === payment.invoiceId)
      if (invoice) {
        const receipt: any = {
          id: generateId(),
          receiptNumber: `STRUK-${Date.now().toString().slice(-6)}`,
          storeName: storeSettings.storeName,
          storeAddress: storeSettings.storeAddress,
          storePhone: storeSettings.storePhone,
          customerName: invoice.customer,
          customerId: invoice.customerId,
          items: [],
          subtotal: invoice.total,
          discount: 0,
          tax: 0,
          total: invoice.total,
          paymentMethod: method === 'cash' ? 'Cash' : method === 'transfer' ? 'Transfer Bank' : method === 'ewallet' ? 'E-Wallet' : method === 'qris' ? 'QRIS' : 'Kartu Kredit',
          date: payment.date,
          notes: `Pembayaran Invoice ${invoice.invoiceNumber}`,
          relatedInvoiceId: invoice.id,
        }
        
        const receipts = getFromStorage<any[]>('umkm_receipts', [])
        saveToStorage('umkm_receipts', [receipt, ...receipts])
      }

      alert(`Pembayaran diverifikasi!\n\nAuto-sync:\n✅ Invoice ${invoice?.invoiceNumber} → LUNAS\n✅ Cash Flow: +${formatRupiah(payment.amount)}\n✅ Loyalty: +${Math.floor(payment.amount / 10000)} poin\n✅ Struk otomatis dibuat`)
    }

    resetForm()
  }

  const resetForm = () => {
    setCustomerName(''); setCustomerId(''); setAmount(0); setMethod('cash')
    setReference(''); setNotes(''); setSelectedInvoice(''); setShowForm(false)
  }

  const updateStatus = (id: string, status: Payment['status']) => {
    const payment = payments.find(p => p.id === id)
    if (!payment) return

    const updated = payments.map(p => p.id === id ? { ...p, status } : p)
    setPayments(updated)
    saveToStorage('umkm_payments', updated)

    // If verified and linked to invoice, auto-sync
    if (status === 'verified' && payment.invoiceId && payment.status !== 'verified') {
      // Update invoice status
      const updatedInvoices = invoices.map(inv =>
        inv.id === payment.invoiceId ? { ...inv, status: 'paid' as const } : inv
      )
      setInvoices(updatedInvoices)
      saveToStorage('umkm_invoices', updatedInvoices)

      // Create Cash Flow entry
      const transactions = getFromStorage<any[]>('umkm_transactions', [])
      const newTransaction = {
        id: generateId(),
        type: 'income',
        amount: payment.amount,
        category: 'Pembayaran Invoice',
        description: `Payment #${payment.reference || payment.id.slice(-6)} - ${payment.customerName}`,
        date: payment.date,
        customerId: payment.customerId,
      }
      saveToStorage('umkm_transactions', [newTransaction, ...transactions])

      // Auto-earn Loyalty points
      if (payment.customerId) {
        const loyaltyMembers = getFromStorage<any[]>('umkm_loyalty_members', [])
        const member = loyaltyMembers.find((m: any) => m.id === payment.customerId)
        if (member) {
          const earnedPoints = Math.floor(payment.amount / 10000)
          member.points += earnedPoints
          member.totalSpent += payment.amount
          
          if (member.totalSpent >= 10000000) member.tier = 'platinum'
          else if (member.totalSpent >= 5000000) member.tier = 'gold'
          else if (member.totalSpent >= 2000000) member.tier = 'silver'
          
          saveToStorage('umkm_loyalty_members', loyaltyMembers)
        }
      }

      alert(`Pembayaran diverifikasi!\n\nAuto-sync:\n✅ Invoice → LUNAS\n✅ Cash Flow: +${formatRupiah(payment.amount)}\n✅ Loyalty: +${Math.floor(payment.amount / 10000)} poin`)
    }
  }

  const deletePayment = (id: string) => {
    if (confirm('Hapus pembayaran ini?')) {
      const updated = payments.filter(p => p.id !== id)
      setPayments(updated)
      saveToStorage('umkm_payments', updated)
    }
  }

  const filteredPayments = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const totalVerified = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  const methodLabels = { cash: 'Cash', transfer: 'Transfer', ewallet: 'E-Wallet', qris: 'QRIS', credit: 'Kartu Kredit' }
  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    verified: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    failed: 'bg-rose-50 text-rose-600 border-rose-200',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Tracker</h2>
          <p className="text-slate-600 mt-1">Lacak dan verifikasi pembayaran invoice</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Catat Pembayaran'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Terverifikasi</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalVerified)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Menunggu Verifikasi</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="file-text" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Invoice Belum Lunas</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{unpaidInvoices.length}</p>
        </div>
      </div>

      {/* Unpaid Invoices Quick View */}
      {unpaidInvoices.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="alert" size={20} className="text-amber-600" /> Invoice yang Perlu Dibayar
          </h3>
          <div className="space-y-2">
            {unpaidInvoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800">{inv.invoiceNumber}</p>
                  <p className="text-sm text-slate-600">{inv.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatRupiah(inv.total)}</p>
                  <p className="text-xs text-slate-500">Jatuh tempo: {formatDate(inv.dueDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        {(['all', 'pending', 'verified', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm transition-colors ${filter === f ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
            {f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : f === 'verified' ? 'Verified' : 'Failed'}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Catat Pembayaran Baru</h3>
          
          {/* Select Invoice */}
          {unpaidInvoices.length > 0 && (
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Pilih Invoice (Opsional)</label>
              <select value={selectedInvoice} onChange={e => handleSelectInvoice(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option value="">-- Pembayaran Umum (Tanpa Invoice) --</option>
                {unpaidInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customer} - {formatRupiah(inv.total)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Pilih invoice untuk auto-fill data customer & amount</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama Pelanggan *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Jumlah (Rp) *</label>
              <input type="number" value={amount || ''} onChange={e => setAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Metode Pembayaran</label>
              <select value={method} onChange={e => setMethod(e.target.value as Payment['method'])}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option value="cash">Cash</option>
                <option value="transfer">Transfer Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="qris">QRIS</option>
                <option value="credit">Kartu Kredit</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">No. Referensi/Bukti</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                placeholder="No. transaksi / bukti transfer"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..."
              rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
          </div>
          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan Pembayaran
          </button>
        </div>
      )}

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="dollar" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada pembayaran tercatat</p>
          </div>
        ) : (
          filteredPayments.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-slate-900">{p.customerName}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[p.status]}`}>
                      {p.status === 'pending' ? 'PENDING' : p.status === 'verified' ? 'VERIFIED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{methodLabels[p.method]}</span>
                    {p.reference && <span>Ref: {p.reference}</span>}
                    <span>{formatDate(p.date)}</span>
                    {p.invoiceId && <span className="text-indigo-600 font-medium">Invoice: {invoices.find(i => i.id === p.invoiceId)?.invoiceNumber}</span>}
                  </div>
                </div>
                <p className="text-xl font-bold text-indigo-600">{formatRupiah(p.amount)}</p>
              </div>
              <div className="flex gap-2 mt-4">
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(p.id, 'verified')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-1">
                      <Icon name="check" size={14} /> Verifikasi
                    </button>
                    <button onClick={() => updateStatus(p.id, 'failed')}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1">
                      <Icon name="x-circle" size={14} /> Tolak
                    </button>
                  </>
                )}
                <button onClick={() => deletePayment(p.id)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors flex items-center gap-1 ml-auto">
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
