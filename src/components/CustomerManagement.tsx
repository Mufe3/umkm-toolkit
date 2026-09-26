import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'

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
  lastTransaction: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  customerId?: string
}

interface Invoice {
  id: string
  invoiceNumber?: string
  customer: string
  customerId?: string
  total: number
  date: string
  status: 'paid' | 'unpaid'
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'debt' | 'vip'>('all')

  // Form state
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
    
    // Update customer stats from transactions and invoices
    const transactions = getFromStorage<Transaction[]>('umkm_transactions', [])
    const invoices = getFromStorage<Invoice[]>('umkm_invoices', [])
    
    const updatedCustomers = savedCustomers.map(customer => {
      const customerTransactions = transactions.filter(t => t.customerId === customer.id)
      const customerInvoices = invoices.filter(i => i.customerId === customer.id || i.customer === customer.name)
      
      const totalSpent = customerTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const outstandingDebt = customerInvoices
        .filter(i => i.status === 'unpaid')
        .reduce((sum, i) => sum + i.total, 0)
      
      const lastTransaction = customerTransactions.length > 0
        ? customerTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : customer.createdAt
      
      return {
        ...customer,
        totalTransactions: customerTransactions.length,
        totalSpent,
        outstandingDebt,
        lastTransaction,
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
        c.id === editingCustomer.id
          ? { ...c, name, phone, email, address, notes }
          : c
      )
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    } else {
      const customer: Customer = {
        id: generateId(),
        name,
        phone,
        email,
        address,
        notes,
        totalTransactions: 0,
        totalSpent: 0,
        outstandingDebt: 0,
        createdAt: new Date().toISOString(),
        lastTransaction: new Date().toISOString(),
      }
      const updated = [customer, ...customers]
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    }

    resetForm()
  }

  const resetForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setNotes('')
    setShowForm(false)
    setEditingCustomer(null)
  }

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setName(customer.name)
    setPhone(customer.phone)
    setEmail(customer.email)
    setAddress(customer.address)
    setNotes(customer.notes)
    setShowForm(true)
  }

  const deleteCustomer = (id: string) => {
    if (confirm('Hapus pelanggan ini?')) {
      const updated = customers.filter(c => c.id !== id)
      setCustomers(updated)
      saveToStorage('umkm_customers', updated)
    }
  }

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'debt') {
      return matchSearch && c.outstandingDebt > 0
    }
    if (filter === 'vip') {
      return matchSearch && c.totalSpent >= 5000000 // VIP: total belanja >= 5 juta
    }
    return matchSearch
  })

  // Stats
  const totalCustomers = customers.length
  const totalDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0)
  const vipCustomers = customers.filter(c => c.totalSpent >= 5000000).length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  // Customer Detail View
  if (viewCustomer) {
    const transactions = getFromStorage<Transaction[]>('umkm_transactions', [])
    const invoices = getFromStorage<Invoice[]>('umkm_invoices', [])
    
    const customerTransactions = transactions
      .filter(t => t.customerId === viewCustomer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const customerInvoices = invoices
      .filter(i => i.customerId === viewCustomer.id || i.customer === viewCustomer.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewCustomer(null)}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Kembali
        </button>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{viewCustomer.name}</h2>
              <p className="text-gray-400">Pelanggan sejak {formatDate(viewCustomer.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(viewCustomer)}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  setViewCustomer(null)
                  startEdit(viewCustomer)
                }}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                🗑️ Hapus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Transaksi</p>
              <p className="text-2xl font-bold">{viewCustomer.totalTransactions}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Belanja</p>
              <p className="text-2xl font-bold text-green-400">{formatRupiah(viewCustomer.totalSpent)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Hutang</p>
              <p className={`text-2xl font-bold ${viewCustomer.outstandingDebt > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {formatRupiah(viewCustomer.outstandingDebt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">📱 Telepon</p>
              <p className="text-lg">{viewCustomer.phone}</p>
            </div>
            {viewCustomer.email && (
              <div>
                <p className="text-sm text-gray-400 mb-1">📧 Email</p>
                <p className="text-lg">{viewCustomer.email}</p>
              </div>
            )}
            {viewCustomer.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-1">📍 Alamat</p>
                <p className="text-lg">{viewCustomer.address}</p>
              </div>
            )}
            {viewCustomer.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-1">📝 Catatan</p>
                <p className="text-lg">{viewCustomer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">📋 Riwayat Transaksi</h3>
          {customerTransactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {customerTransactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-sm text-gray-400">{t.category} • {formatDate(t.date)}</p>
                  </div>
                  <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice History */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">🧾 Riwayat Invoice</h3>
          {customerInvoices.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Belum ada invoice</p>
          ) : (
            <div className="space-y-3">
              {customerInvoices.map(i => (
                <div key={i.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Invoice #{i.invoiceNumber || i.id.slice(-6)}</p>
                    <p className="text-sm text-gray-400">{formatDate(i.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatRupiah(i.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      i.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {i.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">👥 Customer Management</h2>
          <p className="text-gray-400 mt-1">Kelola database pelanggan bisnis kamu</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          {showForm ? 'Batal' : '+ Tambah Pelanggan'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Pelanggan</p>
          <p className="text-2xl font-bold">{totalCustomers}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Piutang</p>
          <p className="text-2xl font-bold text-red-400">{formatRupiah(totalDebt)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Pelanggan VIP</p>
          <p className="text-2xl font-bold text-yellow-400">{vipCustomers}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="🔍 Cari nama, telepon, atau email..."
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-purple-500 focus:outline-none"
        />
        <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'debt', label: '💰 Ada Hutang' },
            { id: 'vip', label: '⭐ VIP' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === f.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h3 className="text-xl font-bold">
            {editingCustomer ? '✏️ Edit Pelanggan' : '👤 Tambah Pelanggan Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nama *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama pelanggan"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">No. Telepon *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Alamat</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Alamat lengkap"
              rows={2}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            />
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
            💾 {editingCustomer ? 'Update' : 'Simpan'} Pelanggan
          </button>
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-400">
              {searchTerm || filter !== 'all'
                ? 'Tidak ada pelanggan yang cocok'
                : 'Belum ada pelanggan. Tambah pelanggan pertamamu!'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => setViewCustomer(customer)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-white">{customer.name}</h4>
                    {customer.totalSpent >= 5000000 && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                        ⭐ VIP
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                    <span>📱 {customer.phone}</span>
                    {customer.email && <span>📧 {customer.email}</span>}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-400">
                      Transaksi: <span className="text-white font-semibold">{customer.totalTransactions}</span>
                    </span>
                    <span className="text-gray-400">
                      Total: <span className="text-green-400 font-semibold">{formatRupiah(customer.totalSpent)}</span>
                    </span>
                    {customer.outstandingDebt > 0 && (
                      <span className="text-gray-400">
                        Hutang: <span className="text-red-400 font-semibold">{formatRupiah(customer.outstandingDebt)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEdit(customer)
                    }}
                    className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCustomer(customer.id)
                    }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    🗑️
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
