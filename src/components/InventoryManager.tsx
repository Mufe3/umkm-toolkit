import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'

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

  // Form state
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
      // Update existing
      const updated = products.map(p =>
        p.id === editingProduct.id
          ? { ...p, name, category, stock, minStock, price, unit, lastUpdated: new Date().toISOString() }
          : p
      )
      setProducts(updated)
      saveToStorage('umkm_products', updated)
    } else {
      // Create new
      const product: Product = {
        id: generateId(),
        name,
        category,
        stock,
        minStock,
        price,
        unit,
        lastUpdated: new Date().toISOString(),
      }
      const updated = [product, ...products]
      setProducts(updated)
      saveToStorage('umkm_products', updated)
    }

    resetForm()
  }

  const resetForm = () => {
    setName('')
    setCategory('')
    setStock(0)
    setMinStock(5)
    setPrice(0)
    setUnit('pcs')
    setShowForm(false)
    setEditingProduct(null)
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setCategory(product.category)
    setStock(product.stock)
    setMinStock(product.minStock)
    setPrice(product.price)
    setUnit(product.unit)
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
      p.id === id
        ? { ...p, stock: Math.max(0, p.stock + delta), lastUpdated: new Date().toISOString() }
        : p
    )
    setProducts(updated)
    saveToStorage('umkm_products', updated)
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())

    if (stockFilter === 'low') {
      return matchSearch && p.stock <= p.minStock && p.stock > 0
    }
    if (stockFilter === 'out') {
      return matchSearch && p.stock === 0
    }
    return matchSearch
  })

  // Stats
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  // Categories
  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">📦 Inventory Manager</h2>
          <p className="text-gray-400 mt-1">Kelola stok produk bisnis kamu</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          {showForm ? 'Batal' : '+ Tambah Produk'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Produk</p>
          <p className="text-2xl font-bold text-white">{totalProducts}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Nilai Inventori</p>
          <p className="text-2xl font-bold text-purple-400">{formatRupiah(totalValue)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Stok Menipis</p>
          <p className="text-2xl font-bold text-yellow-400">{lowStockCount}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Stok Habis</p>
          <p className="text-2xl font-bold text-red-400">{outOfStockCount}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="🔍 Cari produk..."
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-purple-500 focus:outline-none"
        />
        <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'low', label: '⚠️ Menipis' },
            { id: 'out', label: '❌ Habis' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setStockFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${
                stockFilter === f.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
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
            {editingProduct ? '✏️ Edit Produk' : '📦 Tambah Produk Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nama Produk *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Baju Polos"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Kategori *</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Contoh: Pakaian"
                list="categories"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <datalist id="categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Stok</label>
              <input
                type="number"
                value={stock || ''}
                onChange={e => setStock(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Stok Minimum</label>
              <input
                type="number"
                value={minStock || ''}
                onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                placeholder="5"
                min="0"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Satuan</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              >
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
            <label className="text-sm text-gray-400 mb-1 block">Harga per Unit (Rp)</label>
            <input
              type="number"
              value={price || ''}
              onChange={e => setPrice(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/30"
          >
            💾 {editingProduct ? 'Update' : 'Simpan'} Produk
          </button>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400">
              {searchTerm || stockFilter !== 'all'
                ? 'Tidak ada produk yang cocok'
                : 'Belum ada produk. Tambah produk pertamamu!'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLow = product.stock <= product.minStock && product.stock > 0
            const isOut = product.stock === 0
            return (
              <div
                key={product.id}
                className={`bg-gray-900 rounded-xl p-5 border transition-colors ${
                  isOut
                    ? 'border-red-500/50 bg-red-500/5'
                    : isLow
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-white">{product.name}</h4>
                      {isOut && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                          HABIS
                        </span>
                      )}
                      {isLow && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                          MENIPIS
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                      <span>📁 {product.category}</span>
                      <span>💰 {formatRupiah(product.price)}/{product.unit}</span>
                      <span>📊 Nilai: {formatRupiah(product.stock * product.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stock Controls */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => updateStock(product.id, -1)}
                        className="w-8 h-8 rounded bg-gray-700 hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className={`w-16 text-center font-bold ${
                        isOut ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {product.stock} {product.unit}
                      </span>
                      <button
                        onClick={() => updateStock(product.id, 1)}
                        className="w-8 h-8 rounded bg-gray-700 hover:bg-green-600 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                      >
                        🗑️
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
