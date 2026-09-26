import { useEffect, useState } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import { Icon, StatIcon } from './Icon'

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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 rounded-2xl p-8 border border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-slate-800">Selamat Datang!</h2>
            <p className="text-slate-600 text-lg">
              Kelola bisnis UMKM Anda dengan mudah menggunakan toolkit lengkap ini.
            </p>
          </div>
          <div className="hidden md:block opacity-10">
            <Icon name="zap" size={80} className="text-indigo-600" filled />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-4">
            <StatIcon icon="dollar" color="indigo" />
            <Icon 
              name={balance >= 0 ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              className={balance >= 0 ? 'text-emerald-500' : 'text-rose-500'} 
            />
          </div>
          <p className="text-sm text-slate-500 mb-1">Saldo</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(balance)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-4">
            <StatIcon icon="trending-up" color="teal" />
            <Icon name="check" size={16} className="text-emerald-500" />
          </div>
          <p className="text-sm text-slate-500 mb-1">Pemasukan</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-4">
            <StatIcon icon="trending-down" color="rose" />
            <Icon name="alert-circle" size={16} className="text-rose-500" />
          </div>
          <p className="text-sm text-slate-500 mb-1">Pengeluaran</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalExpense)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-4">
            <StatIcon icon="package" color="violet" />
            <span className="text-sm font-semibold text-violet-600">{products.length}</span>
          </div>
          <p className="text-sm text-slate-500 mb-1">Total Produk</p>
          <p className="text-2xl font-bold text-slate-800">{products.length}</p>
        </div>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="alert" size={20} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Stok Menipis</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-2">
                <Icon name="check-circle" size={40} className="text-emerald-500 mx-auto" />
              </div>
              <p className="text-slate-500">Semua stok aman!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700 font-medium">{product.name}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    product.stock <= 2 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {product.stock} pcs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <Icon name="invoice" size={20} className="text-sky-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Invoice Belum Dibayar</h3>
          </div>
          {unpaidInvoices.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-2">
                <Icon name="check-circle" size={40} className="text-emerald-500 mx-auto" />
              </div>
              <p className="text-slate-500">Semua invoice sudah lunas!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unpaidInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700 font-medium">{invoice.customer}</span>
                  <span className="text-amber-600 font-semibold">{formatRupiah(invoice.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="zap" size={20} className="text-indigo-500" filled />
          <h3 className="text-lg font-semibold text-slate-800">Aksi Cepat</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="group p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
            <div className="mb-3 group-hover:scale-110 transition-transform">
              <Icon name="invoice" size={32} className="text-indigo-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Buat Invoice</div>
          </button>
          <button className="group p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
            <div className="mb-3 group-hover:scale-110 transition-transform">
              <Icon name="cashflow" size={32} className="text-emerald-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Catat Transaksi</div>
          </button>
          <button className="group p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all">
            <div className="mb-3 group-hover:scale-110 transition-transform">
              <Icon name="inventory" size={32} className="text-sky-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Tambah Produk</div>
          </button>
          <button className="group p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-all">
            <div className="mb-3 group-hover:scale-110 transition-transform">
              <Icon name="calculator" size={32} className="text-amber-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Hitung Harga</div>
          </button>
        </div>
      </div>
    </div>
  )
}
