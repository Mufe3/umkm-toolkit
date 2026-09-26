import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

const incomeCategories = ['Penjualan Produk', 'Penjualan Jasa', 'Komisi', 'Investasi', 'Lainnya']
const expenseCategories = ['Bahan Baku', 'Gaji Karyawan', 'Sewa', 'Listrik/Air', 'Transportasi', 'Marketing', 'Pajak', 'Lainnya']

export default function CashFlowTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month')

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setTransactions(getFromStorage<Transaction[]>('umkm_transactions', []))
  }, [])

  const handleSubmit = () => {
    if (!amount || !category || !description) {
      alert('Lengkapi semua data!')
      return
    }

    const transaction: Transaction = {
      id: generateId(),
      type,
      amount,
      category,
      description,
      date: new Date(date).toISOString(),
    }

    const updated = [transaction, ...transactions]
    setTransactions(updated)
    saveToStorage('umkm_transactions', updated)
    resetForm()
  }

  const resetForm = () => {
    setAmount(0)
    setCategory('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
  }

  const deleteTransaction = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      const updated = transactions.filter(t => t.id !== id)
      setTransactions(updated)
      saveToStorage('umkm_transactions', updated)
    }
  }

  // Filter by period
  const filteredByPeriod = transactions.filter(t => {
    const tDate = new Date(t.date)
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return tDate >= weekAgo
    }
    if (period === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  const filteredTransactions = filter === 'all'
    ? filteredByPeriod
    : filteredByPeriod.filter(t => t.type === filter)

  const totalIncome = filteredByPeriod
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = filteredByPeriod
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  // Category breakdown
  const categoryBreakdown = filteredByPeriod
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const maxCategoryAmount = Math.max(...Object.values(categoryBreakdown), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">💰 Cash Flow Tracker</h2>
          <p className="text-gray-400 mt-1">Catat pemasukan & pengeluaran bisnis kamu</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          {showForm ? 'Batal' : '+ Catat Transaksi'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-5 border border-green-500/30">
          <p className="text-sm text-gray-400 mb-1">📈 Pemasukan</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 rounded-xl p-5 border border-red-500/30">
          <p className="text-sm text-gray-400 mb-1">📉 Pengeluaran</p>
          <p className="text-2xl font-bold text-red-400">{formatRupiah(totalExpense)}</p>
        </div>
        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-600/20 to-cyan-600/20 border-blue-500/30' : 'from-orange-600/20 to-red-600/20 border-orange-500/30'} rounded-xl p-5 border`}>
          <p className="text-sm text-gray-400 mb-1">💰 Saldo</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {formatRupiah(balance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {([
            { id: 'week', label: 'Minggu Ini' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua' },
          ] as const).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                period === p.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h3 className="text-xl font-bold">Catat Transaksi Baru</h3>

          {/* Type Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setType('income'); setCategory('') }}
              className={`flex-1 py-2 rounded-md font-semibold transition-colors ${
                type === 'income' ? 'bg-green-600 text-white' : 'text-gray-400'
              }`}
            >
              📈 Pemasukan
            </button>
            <button
              onClick={() => { setType('expense'); setCategory('') }}
              className={`flex-1 py-2 rounded-md font-semibold transition-colors ${
                type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400'
              }`}
            >
              📉 Pengeluaran
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Jumlah (Rp) *</label>
            <input
              type="number"
              value={amount || ''}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Kategori *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="">Pilih kategori</option>
              {(type === 'income' ? incomeCategories : expenseCategories).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Keterangan *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Penjualan 10 pcs baju"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02] shadow-lg ${
              type === 'income'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/30'
                : 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/30'
            }`}
          >
            💾 Simpan Transaksi
          </button>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">📊 Pengeluaran per Kategori</h3>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{cat}</span>
                    <span className="text-gray-400">{formatRupiah(amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold">📋 Riwayat Transaksi</h3>
        {filteredTransactions.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-gray-400">Belum ada transaksi. Mulai catat sekarang!</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    t.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {t.type === 'income' ? '📈' : '📉'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{t.description}</p>
                    <p className="text-sm text-gray-400">{t.category} • {formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-xs text-gray-500 hover:text-red-400 mt-1"
                  >
                    Hapus
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
