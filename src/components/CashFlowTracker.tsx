import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import * as XLSX from 'xlsx'
import { Icon } from './Icon'

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
      type, amount, category, description,
      date: new Date(date).toISOString(),
    }
    const updated = [transaction, ...transactions]
    setTransactions(updated)
    saveToStorage('umkm_transactions', updated)
    resetForm()
  }

  const resetForm = () => {
    setAmount(0); setCategory(''); setDescription('')
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

  const totalIncome = filteredByPeriod.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredByPeriod.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const categoryBreakdown = filteredByPeriod
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const maxCategoryAmount = Math.max(...Object.values(categoryBreakdown), 1)

  const handleExportExcel = () => {
    const data = filteredTransactions.map(t => ({
      Tanggal: formatDate(t.date),
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Keterangan: t.description,
      Jumlah: t.amount,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.writeFile(wb, `cashflow_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleBackupJSON = () => {
    const data = JSON.stringify(transactions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_cashflow_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cash Flow Tracker</h2>
          <p className="text-slate-500 mt-1">Catat pemasukan & pengeluaran bisnis Anda</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1">
            <Icon name="download" size={14} /> Excel
          </button>
          <button onClick={handleBackupJSON}
            className="px-4 py-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium flex items-center gap-1">
            <Icon name="download" size={14} /> Backup
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-400 to-violet-400 text-white rounded-lg font-medium hover:shadow-md hover:shadow-indigo-100 transition-all flex items-center gap-2">
            <Icon name={showForm ? 'close' : 'plus'} size={18} />
            {showForm ? 'Batal' : 'Catat Transaksi'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="trending-up" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500">Pemasukan</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="trending-down" size={18} className="text-rose-500" />
            </div>
            <p className="text-sm text-slate-500">Pengeluaran</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
              <Icon name="dollar" size={18} className={balance >= 0 ? 'text-indigo-500' : 'text-amber-500'} />
            </div>
            <p className="text-sm text-slate-500">Saldo</p>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {formatRupiah(balance)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === f ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {f === 'all' ? 'Semua' : f === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </button>
          ))}
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'week', label: 'Minggu Ini' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua' },
          ] as const).map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                period === p.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800">Catat Transaksi Baru</h3>

          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => { setType('income'); setCategory('') }}
              className={`flex-1 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}>
              <Icon name="trending-up" size={16} /> Pemasukan
            </button>
            <button onClick={() => { setType('expense'); setCategory('') }}
              className={`flex-1 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
              }`}>
              <Icon name="trending-down" size={16} /> Pengeluaran
            </button>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Jumlah (Rp) *</label>
            <input type="number" value={amount || ''} onChange={e => setAmount(parseInt(e.target.value) || 0)}
              placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-lg text-slate-800" />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Kategori *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800">
              <option value="">Pilih kategori</option>
              {(type === 'income' ? incomeCategories : expenseCategories).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Keterangan *</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Penjualan 10 pcs baju"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              type === 'income'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white hover:shadow-md hover:shadow-emerald-100'
                : 'bg-gradient-to-r from-rose-400 to-pink-400 text-white hover:shadow-md hover:shadow-rose-100'
            }`}>
            <Icon name="check" size={18} /> Simpan Transaksi
          </button>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="analytics" size={18} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Pengeluaran per Kategori</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{cat}</span>
                    <span className="text-slate-500">{formatRupiah(amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full transition-all"
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
        <div className="flex items-center gap-2">
          <Icon name="clock" size={18} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">Riwayat Transaksi</h3>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="cashflow" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">Belum ada transaksi. Mulai catat sekarang!</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    t.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}>
                    <Icon name={t.type === 'income' ? 'trending-up' : 'trending-down'} size={18}
                      className={t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{t.description}</p>
                    <p className="text-sm text-slate-500">{t.category} • {formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer">
                    <Icon name="trash" size={12} /> Hapus
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
