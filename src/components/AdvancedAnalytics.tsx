import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
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

const COLORS = ['#a855f7', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']

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

  // Filter by period
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

  // Daily sales data for chart
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

  // Category breakdown
  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {}
    
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
      }
    })
    
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }

  // Top products by value
  const getTopProducts = () => {
    return [...products]
      .map(p => ({ ...p, value: p.stock * p.price }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  // Invoice stats
  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
    paidValue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    unpaidValue: invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.total, 0),
  }

  // Profit margin analysis
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Sales forecast (simple moving average)
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
        predicted: Math.round(avg * (1 + (Math.random() * 0.2 - 0.1))), // ±10% variance
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
        <h2 className="text-3xl font-bold">📊 Advanced Analytics</h2>
        <p className="text-gray-400 mt-1">Analisis mendalam untuk bisnis kamu</p>
      </div>

      {/* Period Filter */}
      <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden w-fit">
        {([
          { id: 'week', label: 'Minggu Ini' },
          { id: 'month', label: 'Bulan Ini' },
          { id: 'year', label: 'Tahun Ini' },
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-5 border border-green-500/30">
          <p className="text-sm text-gray-400 mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 rounded-xl p-5 border border-red-500/30">
          <p className="text-sm text-gray-400 mb-1">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-400">{formatRupiah(totalExpense)}</p>
        </div>
        <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-blue-600/20 to-cyan-600/20 border-blue-500/30' : 'from-orange-600/20 to-red-600/20 border-orange-500/30'} rounded-xl p-5 border`}>
          <p className="text-sm text-gray-400 mb-1">Keuntungan Bersih</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {formatRupiah(profit)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-5 border border-purple-500/30">
          <p className="text-sm text-gray-400 mb-1">Margin Keuntungan</p>
          <p className={`text-2xl font-bold ${profitMargin >= 20 ? 'text-green-400' : profitMargin >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
            {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Revenue vs Expense Chart */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-4">📈 Pendapatan vs Pengeluaran</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              formatter={(value: number) => formatRupiah(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Pendapatan" />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
            <Line type="monotone" dataKey="profit" stroke="#a855f7" strokeWidth={2} name="Keuntungan" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">🥧 Pengeluaran per Kategori</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Belum ada data pengeluaran</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">🏆 Top 5 Produk (Nilai Inventori)</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.stock} {product.category}</p>
                  </div>
                  <p className="font-bold text-purple-400">{formatRupiah(product.value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">Belum ada produk</p>
          )}
        </div>
      </div>

      {/* Sales Forecast */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-4">🔮 Prediksi Penjualan 7 Hari ke Depan</h3>
        <p className="text-sm text-gray-400 mb-4">Berdasarkan rata-rata penjualan 7 hari terakhir</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              formatter={(value: number) => formatRupiah(value)}
            />
            <Bar dataKey="predicted" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} name="Prediksi" />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Invoice Analytics */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-4">🧾 Analisa Invoice</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Total Invoice</p>
            <p className="text-2xl font-bold">{invoiceStats.total}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Lunas</p>
            <p className="text-2xl font-bold text-green-400">{invoiceStats.paid}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Belum Lunas</p>
            <p className="text-2xl font-bold text-red-400">{invoiceStats.unpaid}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Piutang</p>
            <p className="text-2xl font-bold text-orange-400">{formatRupiah(invoiceStats.unpaidValue)}</p>
          </div>
        </div>
        
        {/* Payment Progress */}
        {invoiceStats.total > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Tingkat Pelunasan</span>
              <span className="text-white font-bold">
                {((invoiceStats.paid / invoiceStats.total) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${(invoiceStats.paid / invoiceStats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
