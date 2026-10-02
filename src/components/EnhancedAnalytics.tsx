import { useState, useEffect } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import { Icon } from './Icon'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
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

interface Receipt {
  id: string
  customerName: string
  total: number
  date: string
  items: Array<{ name: string; qty: number; price: number }>
}

const COLORS = ['#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff']

export default function EnhancedAnalytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    setTransactions(getFromStorage<Transaction[]>('umkm_transactions', []))
    setProducts(getFromStorage<Product[]>('umkm_products', []))
    setReceipts(getFromStorage<Receipt[]>('umkm_receipts', []))
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

  // Key Metrics
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0
  const avgTransaction = filteredTransactions.filter(t => t.type === 'income').length > 0
    ? totalIncome / filteredTransactions.filter(t => t.type === 'income').length
    : 0

  // Daily sales data
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
    const incomeByCategory: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
      }
    })

    return {
      income: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
    }
  }

  // Top products
  const getTopProducts = () => {
    const productSales: Record<string, { qty: number; revenue: number }> = {}
    
    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { qty: 0, revenue: 0 }
        }
        productSales[item.name].qty += item.qty
        productSales[item.name].revenue += item.qty * item.price
      })
    })

    return Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  // Hourly sales pattern
  const getHourlyData = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      sales: 0,
    }))

    receipts.forEach(receipt => {
      const hour = new Date(receipt.date).getHours()
      hourlyData[hour].sales += receipt.total
    })

    return hourlyData
  }

  // Customer analysis
  const getCustomerAnalysis = () => {
    const customerData: Record<string, { transactions: number; total: number }> = {}
    
    receipts.forEach(receipt => {
      if (!customerData[receipt.customerName]) {
        customerData[receipt.customerName] = { transactions: 0, total: 0 }
      }
      customerData[receipt.customerName].transactions += 1
      customerData[receipt.customerName].total += receipt.total
    })

    return Object.entries(customerData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }

  // Inventory metrics
  const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0).length
  const outOfStockProducts = products.filter(p => p.stock === 0).length

  const dailyData = getDailyData()
  const categoryData = getCategoryData()
  const topProducts = getTopProducts()
  const hourlyData = getHourlyData()
  const customerAnalysis = getCustomerAnalysis()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Enhanced Analytics</h2>
          <p className="text-slate-600 mt-1">Analisis bisnis mendalam dengan insights actionable</p>
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'week', label: 'Minggu' },
            { id: 'month', label: 'Bulan' },
            { id: 'year', label: 'Tahun' },
            { id: 'all', label: 'Semua' },
          ] as const).map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm transition-colors ${period === p.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="trending-up" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Pendapatan</p>
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
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="dollar" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Laba Bersih</p>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(profit)}
          </p>
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
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="calculator" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Rata-rata Transaksi</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(avgTransaction)}</p>
        </div>
      </div>

      {/* Revenue & Expense Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="analytics" size={20} className="text-indigo-500" />
          Tren Pendapatan & Pengeluaran
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: number) => formatRupiah(value)} />
            <Legend />
            <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Pendapatan" />
            <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} name="Pengeluaran" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="trending-up" size={20} className="text-emerald-500" />
            Pendapatan per Kategori
          </h3>
          {categoryData.income.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData.income} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100} fill="#8884d8" dataKey="value">
                  {categoryData.income.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada data</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="trending-down" size={20} className="text-rose-500" />
            Pengeluaran per Kategori
          </h3>
          {categoryData.expense.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData.expense} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100} fill="#8884d8" dataKey="value">
                  {categoryData.expense.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Top Products & Hourly Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="award" size={20} className="text-amber-500" />
            Top 10 Produk Terlaris
          </h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.qty} terjual</p>
                  </div>
                  <p className="font-bold text-indigo-600">{formatRupiah(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada data</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="clock" size={20} className="text-blue-500" />
            Pola Penjualan per Jam
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} formatter={(value: number) => formatRupiah(value)} />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Penjualan" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Analysis & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="customers" size={20} className="text-violet-500" />
            Top 10 Customer
          </h3>
          {customerAnalysis.length > 0 ? (
            <div className="space-y-3">
              {customerAnalysis.map((customer, i) => (
                <div key={customer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{customer.name}</p>
                    <p className="text-sm text-slate-500">{customer.transactions} transaksi</p>
                  </div>
                  <p className="font-bold text-violet-600">{formatRupiah(customer.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">Belum ada data</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="package" size={20} className="text-indigo-500" />
            Metrik Inventori
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Nilai Inventori</p>
                <p className="text-xl font-bold text-slate-900">{formatRupiah(inventoryValue)}</p>
              </div>
              <Icon name="dollar" size={32} className="text-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 mb-1">Stok Menipis</p>
                <p className="text-2xl font-bold text-amber-900">{lowStockProducts}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                <p className="text-sm text-rose-700 mb-1">Stok Habis</p>
                <p className="text-2xl font-bold text-rose-900">{outOfStockProducts}</p>
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-700 mb-1">Total Produk</p>
              <p className="text-2xl font-bold text-indigo-900">{products.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
