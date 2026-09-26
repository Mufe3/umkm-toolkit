import { useEffect, useState } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
}

interface Product {
  id: string
  name: string
  stock: number
  price: number
}

interface Invoice {
  id: string
  customer: string
  total: number
  date: string
  status: 'paid' | 'unpaid'
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    setTransactions(getFromStorage<Transaction[]>('umkm_transactions', []))
    setProducts(getFromStorage<Product[]>('umkm_products', []))
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
  }, [])

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const lowStockProducts = products.filter(p => p.stock <= 5)
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')

  const stats = [
    {
      label: 'Saldo',
      value: formatRupiah(balance),
      icon: '💰',
      color: balance >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
    },
    {
      label: 'Pemasukan',
      value: formatRupiah(totalIncome),
      icon: '📈',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Pengeluaran',
      value: formatRupiah(totalExpense),
      icon: '📉',
      color: 'from-orange-500 to-red-500',
    },
    {
      label: 'Total Produk',
      value: products.length.toString(),
      icon: '📦',
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30">
        <h2 className="text-3xl font-bold mb-2">Selamat Datang! 👋</h2>
        <p className="text-gray-300">
          Kelola bisnis UMKM kamu dengan mudah menggunakan toolkit lengkap ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.color} opacity-20`} />
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span> Stok Menipis
          </h3>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-400">Semua stok aman! 👍</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-white">{product.name}</span>
                  <span className={`font-bold ${product.stock <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {product.stock} pcs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🧾</span> Invoice Belum Dibayar
          </h3>
          {unpaidInvoices.length === 0 ? (
            <p className="text-gray-400">Semua invoice sudah lunas! 🎉</p>
          ) : (
            <div className="space-y-2">
              {unpaidInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-white">{invoice.customer}</span>
                  <span className="font-bold text-orange-400">{formatRupiah(invoice.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold mb-4">⚡ Aksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-105">
            <div className="text-2xl mb-2">🧾</div>
            <div className="text-sm text-gray-300">Buat Invoice</div>
          </button>
          <button className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all hover:scale-105">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-gray-300">Catat Transaksi</div>
          </button>
          <button className="p-4 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all hover:scale-105">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm text-gray-300">Tambah Produk</div>
          </button>
          <button className="p-4 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl border border-orange-500/30 hover:border-orange-500/50 transition-all hover:scale-105">
            <div className="text-2xl mb-2">🧮</div>
            <div className="text-sm text-gray-300">Hitung Harga</div>
          </button>
        </div>
      </div>
    </div>
  )
}
