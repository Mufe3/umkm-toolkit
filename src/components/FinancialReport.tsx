import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah, formatDate } from '../utils/storage'
import { Icon } from './Icon'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import * as XLSX from 'xlsx'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

export default function FinancialReport() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    setTransactions(getFromStorage<Transaction[]>('umkm_transactions', []))
  }, [])

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date)
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return tDate >= weekAgo
    }
    if (period === 'month') {
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    }
    if (period === 'year') {
      return tDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Monthly data for chart
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === index && d.getFullYear() === currentYear
      })
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      return { month, income, expense, profit: income - expense }
    })
  }

  // Category breakdown
  const getCategoryBreakdown = () => {
    const incomeByCategory: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
      }
    })

    return { incomeByCategory, expenseByCategory }
  }

  const handleExportReport = () => {
    const { incomeByCategory, expenseByCategory } = getCategoryBreakdown()
    
    const reportData = [
      { Section: 'RINGKASAN KEUANGAN', Item: '', Amount: '' },
      { Section: '', Item: 'Total Pemasukan', Amount: totalIncome },
      { Section: '', Item: 'Total Pengeluaran', Amount: totalExpense },
      { Section: '', Item: 'Laba Bersih', Amount: profit },
      { Section: '', Item: 'Margin Keuntungan', Amount: `${profitMargin.toFixed(2)}%` },
      { Section: '', Item: '', Amount: '' },
      { Section: 'PEMASUKAN PER KATEGORI', Item: '', Amount: '' },
      ...Object.entries(incomeByCategory).map(([cat, amt]) => ({ Section: '', Item: cat, Amount: amt })),
      { Section: '', Item: '', Amount: '' },
      { Section: 'PENGELUARAN PER KATEGORI', Item: '', Amount: '' },
      ...Object.entries(expenseByCategory).map(([cat, amt]) => ({ Section: '', Item: cat, Amount: amt })),
    ]

    const ws = XLSX.utils.json_to_sheet(reportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan')
    XLSX.writeFile(wb, `laporan_keuangan_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const monthlyData = getMonthlyData()
  const { incomeByCategory, expenseByCategory } = getCategoryBreakdown()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h2>
          <p className="text-slate-600 mt-1">Analisis keuangan bisnis Anda</p>
        </div>
        <button onClick={handleExportReport}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name="download" size={18} /> Export Laporan
        </button>
      </div>

      {/* Period Filter */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        {([
          { id: 'week', label: 'Minggu Ini' },
          { id: 'month', label: 'Bulan Ini' },
          { id: 'year', label: 'Tahun Ini' },
          { id: 'all', label: 'Semua' },
        ] as const).map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 text-sm transition-colors ${period === p.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="trending-up" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Pemasukan</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="trending-down" size={18} className="text-rose-500" />
            </div>
            <p className="text-sm text-slate-600">Pengeluaran</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
              <Icon name="dollar" size={18} className={profit >= 0 ? 'text-indigo-500' : 'text-amber-500'} />
            </div>
            <p className="text-sm text-slate-600">Laba Bersih</p>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>{formatRupiah(profit)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="target" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Margin</p>
          </div>
          <p className={`text-2xl font-bold ${profitMargin >= 20 ? 'text-emerald-600' : profitMargin >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="analytics" size={18} className="text-indigo-500" /> Grafik Bulanan (Tahun Ini)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: number) => formatRupiah(value)} />
            <Bar dataKey="income" fill="#10b981" name="Pemasukan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#f43f5e" name="Pengeluaran" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="trending-up" size={18} className="text-emerald-500" /> Pemasukan per Kategori
          </h3>
          {Object.keys(incomeByCategory).length === 0 ? (
            <p className="text-slate-500 text-center py-8">Belum ada data pemasukan</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(incomeByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="text-emerald-600 font-bold">{formatRupiah(amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="trending-down" size={18} className="text-rose-500" /> Pengeluaran per Kategori
          </h3>
          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="text-slate-500 text-center py-8">Belum ada data pengeluaran</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">{cat}</span>
                    <span className="text-rose-600 font-bold">{formatRupiah(amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
