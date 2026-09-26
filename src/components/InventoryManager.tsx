import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'
import * as XLSX from 'xlsx'
import { Icon } from './Icon'

interface Product {
  id: string
  name: string
  category: string
  stock: number
  minStock: number
  price: number
  unit: string
  lastUpdated: string
}

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [price, setPrice] = useState(0)
  const [unit, setUnit] = useState('pcs')

  useEffect(() => {
    setProducts(getFromStorage<Product[]>('umkm_products', []))
  }, [])

  const handleSubmit = () => {
    if (!name || !category) {
      alert('Lengkapi nama dan kategori produk!')
      return
    }

    if (editingProduct) {
      const updated = products.map(p =>
        p.id === editingProduct.id
          ? { ...p, name, category, stock, minStock, price, unit, lastUpdated: new Date().toISOString() }
          : p
      )
      setProducts(updated)
      saveToStorage('umkm_products', updated)
    } else {
      const product: Product = {
        id: generateId(), name, category, stock, minStock, price, unit,
        lastUpdated: new Date().toISOString(),
      }
      const updated = [product, ...products]
      setProducts(updated)
      saveToStorage('umkm_products', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setName(''); setCategory(''); setStock(0); setMinStock(5); setPrice(0); setUnit('pcs')
    setShowForm(false); setEditingProduct(null)
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setName(product.name); setCategory(product.category); setStock(product.stock)
    setMinStock(product.minStock); setPrice(product.price); setUnit(product.unit)
    setShowForm(true)
  }

  const deleteProduct = (id: string) => {
    if (confirm('Hapus produk ini?')) {
      const updated = products.filter(p => p.id !== id)
      setProducts(updated)
      saveToStorage('umkm_products', updated)
    }
  }

  const updateStock = (id: string, delta: number) => {
    const updated = products.map(p =>
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), lastUpdated: new Date().toISOString() } : p
    )
    setProducts(updated)
    saveToStorage('umkm_products', updated)
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    if (stockFilter === 'low') return matchSearch && p.stock <= p.minStock && p.stock > 0
    if (stockFilter === 'out') return matchSearch && p.stock === 0
    return matchSearch
  })

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length
  const outOfStockCount = products.filter(p => p.stock === 0).length
  const categories = [...new Set(products.map(p => p.category))]

  const handleExportCSV = () => {
    const data = products.map(p => ({
      Nama: p.name, Kategori: p.category, Stok: p.stock,
      'Stok Minimum': p.minStock, Satuan: p.unit,
      'Harga per Unit': p.price, 'Nilai Total': p.stock * p.price,
      Status: p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'Aman',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleBackupJSON = () => {
    const data = JSON.stringify(products, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `backup_inventory_${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Manager</h2>
          <p className="text-slate-500 mt-1">Kelola stok produk bisnis Anda</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1">
            <Icon name="download" size={14} /> Export
          </button>
          <button onClick={handleBackupJSON}
            className="px-4 py-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium flex items-center gap-1">
            <Icon name="download" size={14} /> Backup
          </button>
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Icon name={showForm ? 'close' : 'plus'} size={18} />
            {showForm ? 'Batal' : 'Tambah Produk'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="package" size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-slate-500">Total Produk</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={16} className="text-violet-500" />
            </div>
            <p className="text-xs text-slate-500">Nilai Inventori</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="alert" size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-500">Stok Menipis</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="x-circle" size={16} className="text-rose-500" />
            </div>
            <p className="text-xs text-slate-500">Stok Habis</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{outOfStockCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'low', label: 'Menipis' },
            { id: 'out', label: 'Habis' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setStockFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                stockFilter === f.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'
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
            {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama Produk *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Baju Polos"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Kategori *</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                placeholder="Contoh: Pakaian" list="categories"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
              <datalist id="categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Stok</label>
              <input type="number" value={stock || ''} onChange={e => setStock(parseInt(e.target.value) || 0)}
                placeholder="0" min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Stok Minimum</label>
              <input type="number" value={minStock || ''} onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                placeholder="5" min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Satuan</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800">
                <option value="pcs">Pcs</option>
                <option value="kg">Kg</option>
                <option value="liter">Liter</option>
                <option value="meter">Meter</option>
                <option value="lusin">Lusin</option>
                <option value="dus">Dus</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Harga per Unit (Rp)</label>
            <input type="number" value={price || ''} onChange={e => setPrice(parseInt(e.target.value) || 0)}
              placeholder="0" min="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> {editingProduct ? 'Update' : 'Simpan'} Produk
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="package" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">
              {searchTerm || stockFilter !== 'all' ? 'Tidak ada produk yang cocok' : 'Belum ada produk. Tambah produk pertamamu!'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLow = product.stock <= product.minStock && product.stock > 0
            const isOut = product.stock === 0
            return (
              <div key={product.id}
                className={`bg-white rounded-xl p-5 border shadow-sm transition-colors ${
                  isOut ? 'border-rose-200 bg-rose-50/30' : isLow ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'
                }`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-slate-800">{product.name}</h4>
                      {isOut && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-semibold">HABIS</span>
                      )}
                      {isLow && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">MENIPIS</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Icon name="filter" size={12} /> {product.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="dollar" size={12} /> {formatRupiah(product.price)}/{product.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="analytics" size={12} /> Nilai: {formatRupiah(product.stock * product.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateStock(product.id, -1)}
                        className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600">
                        -
                      </button>
                      <span className={`w-16 text-center font-semibold ${
                        isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {product.stock} {product.unit}
                      </span>
                      <button onClick={() => updateStock(product.id, 1)}
                        className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600">
                        +
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(product)}
                        className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors text-slate-600">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => deleteProduct(product.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
