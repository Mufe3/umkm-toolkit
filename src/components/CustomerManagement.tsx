import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  totalTransactions: number
  totalSpent: number
  outstandingDebt: number
  createdAt: string
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'debt' | 'vip'>('all')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    const savedCustomers = getFromStorage<Customer[]>('umkm_customers', [])
    const transactions = getFromStorage<any[]>('umkm_transactions', [])
    const invoices = getFromStorage<any[]>('umkm_invoices', [])
    
    const updatedCustomers = savedCustomers.map(customer => {
      const customerTransactions = transactions.filter(t => t.customerId === customer.id)
      const customerInvoices = invoices.filter(i => i.customerId === customer.id || i.customer === customer.name)
      
      const totalSpent = customerTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const outstandingDebt = customerInvoices
        .filter(i => i.status === 'unpaid')
        .reduce((sum, i) => sum + i.total, 0)
      
      return {
        ...customer,
        totalTransactions: customerTransactions.length,
        totalSpent,
        outstandingDebt,
      }
    })
    
    setCustomers(updatedCustomers)
  }

  const handleSubmit = () => {
    if (!name || !phone) {
      alert('Nama dan nomor telepon wajib diisi!')
      return
    }

    if (editingCustomer) {
      const updated = customers.map(c =>
        c.id === editingCustomer.id ? { ...c, name, phone, email, address, notes } : c
      )
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    } else {
      const customer: Customer = {
        id: generateId(), name, phone, email, address, notes,
        totalTransactions: 0, totalSpent: 0, outstandingDebt: 0,
        createdAt: new Date().toISOString(),
      }
      const updated = [customer, ...customers]
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('')
    setShowForm(false); setEditingCustomer(null)
  }

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setName(customer.name); setPhone(customer.phone); setEmail(customer.email)
    setAddress(customer.address); setNotes(customer.notes)
    setShowForm(true)
  }

  const deleteCustomer = (id: string) => {
    if (confirm('Hapus pelanggan ini?')) {
      const updated = customers.filter(c => c.id !== id)
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    }
  }

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'debt') return matchSearch && c.outstandingDebt > 0
    if (filter === 'vip') return matchSearch && c.totalSpent >= 5000000
    return matchSearch
  })

  const totalCustomers = customers.length
  const totalDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0)
  const vipCustomers = customers.filter(c => c.totalSpent >= 5000000).length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  if (viewCustomer) {
    const transactions = getFromStorage<any[]>('umkm_transactions', [])
    const invoices = getFromStorage<any[]>('umkm_invoices', [])
    
    const customerTransactions = transactions
      .filter(t => t.customerId === viewCustomer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const customerInvoices = invoices
      .filter(i => i.customerId === viewCustomer.id || i.customer === viewCustomer.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-6">
        <button onClick={() => setViewCustomer(null)} 
          className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
          <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
        </button>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{viewCustomer.name}</h2>
              <p className="text-slate-500">Pelanggan sejak {formatDate(viewCustomer.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(viewCustomer)}
                className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 text-sm font-medium flex items-center gap-1">
                <Icon name="edit" size={14} /> Edit
              </button>
              <button onClick={() => { setViewCustomer(null); deleteCustomer(viewCustomer.id) }}
                className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium flex items-center gap-1">
                <Icon name="trash" size={14} /> Hapus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Total Transaksi</p>
              <p className="text-2xl font-bold text-slate-800">{viewCustomer.totalTransactions}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Total Belanja</p>
              <p className="text-2xl font-bold text-indigo-600">{formatRupiah(viewCustomer.totalSpent)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Hutang</p>
              <p className={`text-2xl font-bold ${viewCustomer.outstandingDebt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {formatRupiah(viewCustomer.outstandingDebt)}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="zap" size={20} className="text-indigo-600" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => {
                  saveToStorage('umkm_quick_action', { type: 'invoice', customerId: viewCustomer.id, customerName: viewCustomer.name, customerPhone: viewCustomer.phone })
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'invoice' }))
                }}
                className="p-4 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform">
                  <Icon name="file-text" size={32} className="text-indigo-600 mx-auto" />
                </div>
                <div className="text-sm font-semibold text-slate-800">Buat Invoice</div>
              </button>
              <button 
                onClick={() => {
                  saveToStorage('umkm_quick_action', { type: 'receipt', customerId: viewCustomer.id, customerName: viewCustomer.name })
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'receipt' }))
                }}
                className="p-4 bg-white rounded-lg border border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform">
                  <Icon name="receipt" size={32} className="text-emerald-600 mx-auto" />
                </div>
                <div className="text-sm font-semibold text-slate-800">Buat Struk</div>
              </button>
              <button 
                onClick={() => {
                  saveToStorage('umkm_quick_action', { type: 'shipping', customerId: viewCustomer.id, customerName: viewCustomer.name, customerPhone: viewCustomer.phone, customerAddress: viewCustomer.address })
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'shipping' }))
                }}
                className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform">
                  <Icon name="truck" size={32} className="text-blue-600 mx-auto" />
                </div>
                <div className="text-sm font-semibold text-slate-800">Buat Resi</div>
              </button>
              <button 
                onClick={() => {
                  if (viewCustomer.phone) {
                    saveToStorage('umkm_quick_action', { type: 'whatsapp', customerId: viewCustomer.id, customerName: viewCustomer.name, customerPhone: viewCustomer.phone })
                    window.dispatchEvent(new CustomEvent('navigate', { detail: 'whatsapp' }))
                  } else {
                    alert('Nomor telepon customer belum tersedia')
                  }
                }}
                className="p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform">
                  <Icon name="message-circle" size={32} className="text-green-600 mx-auto" />
                </div>
                <div className="text-sm font-semibold text-slate-800">WhatsApp</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                <Icon name="phone" size={14} /> Telepon
              </p>
              <p className="text-slate-800">{viewCustomer.phone}</p>
            </div>
            {viewCustomer.email && (
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Icon name="mail" size={14} /> Email
                </p>
                <p className="text-slate-800">{viewCustomer.email}</p>
              </div>
            )}
            {viewCustomer.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Icon name="location" size={14} /> Alamat
                </p>
                <p className="text-slate-800">{viewCustomer.address}</p>
              </div>
            )}
            {viewCustomer.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-1">Catatan</p>
                <p className="text-slate-800">{viewCustomer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Icon name="clock" size={18} className="text-indigo-500" /> Riwayat Transaksi
          </h3>
          {customerTransactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {customerTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{t.description}</p>
                    <p className="text-sm text-slate-500">{t.category} • {formatDate(t.date)}</p>
                  </div>
                  <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Icon name="invoice" size={18} className="text-indigo-500" /> Riwayat Invoice
          </h3>
          {customerInvoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Belum ada invoice</p>
          ) : (
            <div className="space-y-3">
              {customerInvoices.map(i => (
                <div key={i.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">Invoice #{i.invoiceNumber || i.id.slice(-6)}</p>
                    <p className="text-sm text-slate-500">{formatDate(i.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatRupiah(i.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      i.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {i.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Documents History - Integrated View */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Icon name="clock" size={18} className="text-violet-500" /> Semua Dokumen
          </h3>
          {(() => {
            const receipts = getFromStorage<any[]>('umkm_receipts', [])
              .filter(r => r.customerName === viewCustomer.name)
              .map(r => ({ ...r, type: 'receipt' as const }))
            
            const invoicesList = getFromStorage<any[]>('umkm_invoices', [])
              .filter(i => i.customer === viewCustomer.name)
              .map(i => ({ ...i, type: 'invoice' as const }))
            
            const shipments = getFromStorage<any[]>('umkm_shipping_receipts', [])
              .filter(s => s.receiverName === viewCustomer.name)
              .map(s => ({ ...s, type: 'shipping' as const }))
            
            const paymentsList = getFromStorage<any[]>('umkm_payments', [])
              .filter(p => p.customerName === viewCustomer.name)
              .map(p => ({ ...p, type: 'payment' as const }))
            
            const allDocs = [...receipts, ...invoicesList, ...shipments, ...paymentsList]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            
            if (allDocs.length === 0) {
              return <p className="text-slate-500 text-center py-8">Belum ada dokumen</p>
            }
            
            return (
              <div className="space-y-2">
                {allDocs.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        doc.type === 'receipt' ? 'bg-emerald-100' :
                        doc.type === 'invoice' ? 'bg-indigo-100' :
                        doc.type === 'shipping' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon 
                          name={
                            doc.type === 'receipt' ? 'package' : 
                            doc.type === 'invoice' ? 'file-text' : 
                            doc.type === 'shipping' ? 'truck' : 'dollar'
                          } 
                          size={16} 
                          className={
                            doc.type === 'receipt' ? 'text-emerald-600' : 
                            doc.type === 'invoice' ? 'text-indigo-600' : 
                            doc.type === 'shipping' ? 'text-blue-600' : 'text-purple-600'
                          } 
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {doc.type === 'receipt' && `Struk #${doc.receiptNumber || doc.id.slice(-6)}`}
                          {doc.type === 'invoice' && `Invoice #${doc.invoiceNumber || doc.id.slice(-6)}`}
                          {doc.type === 'shipping' && `Resi #${doc.resiNumber || doc.id.slice(-6)}`}
                          {doc.type === 'payment' && `Payment #${doc.reference || doc.id.slice(-6)}`}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(doc.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-sm">
                        {doc.type === 'shipping' 
                          ? formatRupiah(doc.shippingCost + (doc.insurance || 0))
                          : formatRupiah(doc.total || doc.amount)}
                      </p>
                      {doc.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          doc.status === 'paid' || doc.status === 'delivered' || doc.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                          doc.status === 'unpaid' ? 'bg-rose-50 text-rose-600' :
                          doc.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {doc.status === 'paid' ? 'LUNAS' :
                           doc.status === 'unpaid' ? 'BELUM BAYAR' :
                           doc.status === 'delivered' ? 'TERKIRIM' :
                           doc.status === 'in_transit' ? 'DIKIRIM' :
                           doc.status === 'verified' ? 'VERIFIED' :
                           doc.status === 'pending' ? 'PENDING' :
                           doc.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500 mt-1">Kelola database pelanggan bisnis Anda</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Tambah Pelanggan'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="customers" size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-slate-500">Total Pelanggan</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="dollar" size={16} className="text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">Total Pendapatan</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="alert" size={16} className="text-rose-500" />
            </div>
            <p className="text-xs text-slate-500">Piutang</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalDebt)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="star" size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-500">Pelanggan VIP</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{vipCustomers}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="Cari nama, telepon, atau email..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'debt', label: 'Ada Hutang' },
            { id: 'vip', label: 'VIP' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === f.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama pelanggan"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">No. Telepon *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Alamat</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap"
              rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..."
              rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> {editingCustomer ? 'Update' : 'Simpan'} Pelanggan
          </button>
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="customers" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">
              {searchTerm || filter !== 'all' ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan. Tambah pelanggan pertamamu!'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} onClick={() => setViewCustomer(customer)}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-slate-800">{customer.name}</h4>
                    {customer.totalSpent >= 5000000 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Icon name="star" size={10} filled /> VIP
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Icon name="phone" size={12} /> {customer.phone}
                    </span>
                    {customer.email && (
                      <span className="flex items-center gap-1">
                        <Icon name="mail" size={12} /> {customer.email}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-500">
                      Transaksi: <span className="text-slate-800 font-semibold">{customer.totalTransactions}</span>
                    </span>
                    <span className="text-slate-500">
                      Total: <span className="text-indigo-600 font-semibold">{formatRupiah(customer.totalSpent)}</span>
                    </span>
                    {customer.outstandingDebt > 0 && (
                      <span className="text-slate-500">
                        Hutang: <span className="text-rose-600 font-semibold">{formatRupiah(customer.outstandingDebt)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(customer) }}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors text-slate-600">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCustomer(customer.id) }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
