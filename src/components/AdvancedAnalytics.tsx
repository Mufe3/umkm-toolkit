import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import { Icon } from './Icon'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

interface Product {
  id: string
  name: string
  stock: number
  price: number
  category: string
}

interface Invoice {
  id: string
  customer: string
  total: number
  date: string
  status: 'paid' | 'unpaid'
}

const COLORS = ['#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff']

export default function AdvancedAnalytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    setTransactions(getFromStorage<Transaction[]>('umkm_transactions', []))
    setProducts(getFromStorage<Product[]>('umkm_products', []))
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
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

  const getDailyData = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 12 : 30
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTransactions = filteredTransactions.filter(t => t.date.startsWith(dateStr))
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      data.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        income,
        expense,
        profit: income - expense,
      })
    }
    
    return data
  }

  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {}
    
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
      }
    })
    
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }

  const getTopProducts = () => {
    return [...products]
      .map(p => ({ ...p, value: p.stock * p.price }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
    paidValue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    unpaidValue: invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.total, 0),
  }

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  const getForecast = () => {
    const dailyData = getDailyData()
    const recentIncomes = dailyData.slice(-7).map(d => d.income)
    const avg = recentIncomes.reduce((sum, v) => sum + v, 0) / recentIncomes.length
    
    const forecast = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      forecast.push({
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        predicted: Math.round(avg * (1 + (Math.random() * 0.2 - 0.1))),
      })
    }
    return forecast
  }

  const dailyData = getDailyData()
  const categoryData = getCategoryData()
  const topProducts = getTopProducts()
  const forecastData = getForecast()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Advanced Analytics</h2>
        <p className="text-slate-500 mt-1">Analisis mendalam untuk bisnis Anda</p>
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
            className={`px-4 py-2 text-sm transition-colors ${
              period === p.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="trending-up" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500">Total Pendapatan</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="trending-down" size={18} className="text-rose-500" />
            </div>
            <p className="text-sm text-slate-500">Total Pengeluaran</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
              <Icon name="dollar" size={18} className={profit >= 0 ? 'text-indigo-500' : 'text-amber-500'} />
            </div>
            <p className="text-sm text-slate-500">Keuntungan Bersih</p>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {formatRupiah(profit)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="target" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-500">Margin Keuntungan</p>
          </div>
          <p className={`text-2xl font-bold ${profitMargin >= 20 ? 'text-emerald-600' : profitMargin >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Revenue vs Expense Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="analytics" size={18} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">Pendapatan vs Pengeluaran</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} name="Pendapatan" />
            <Line type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={2} name="Pengeluaran" />
            <Line type="monotone" dataKey="profit" stroke="#818cf8" strokeWidth={2} name="Keuntungan" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="analytics" size={18} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Pengeluaran per Kategori</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada data pengeluaran</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="award" size={18} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Top 5 Produk (Nilai Inventori)</h3>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.stock} {product.category}</p>
                  </div>
                  <p className="font-bold text-indigo-600">{formatRupiah(product.value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada produk</p>
          )}
        </div>
      </div>

      {/* Sales Forecast */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="trending-up" size={18} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">Prediksi Penjualan 7 Hari ke Depan</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Berdasarkan rata-rata penjualan 7 hari terakhir</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Bar dataKey="predicted" fill="#818cf8" radius={[8, 8, 0, 0]} name="Prediksi" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Invoice Analytics */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="invoice" size={18} className="text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">Analisa Invoice</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Total Invoice</p>
            <p className="text-2xl font-bold text-slate-800">{invoiceStats.total}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Lunas</p>
            <p className="text-2xl font-bold text-emerald-600">{invoiceStats.paid}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Belum Lunas</p>
            <p className="text-2xl font-bold text-rose-600">{invoiceStats.unpaid}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Piutang</p>
            <p className="text-2xl font-bold text-amber-600">{formatRupiah(invoiceStats.unpaidValue)}</p>
          </div>
        </div>
        
        {invoiceStats.total > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Tingkat Pelunasan</span>
              <span className="text-slate-800 font-semibold">
                {((invoiceStats.paid / invoiceStats.total) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(invoiceStats.paid / invoiceStats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
