import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Bundle {
  id: string
  name: string
  description: string
  products: Array<{ name: string; qty: number; price: number }>
  originalPrice: number
  bundlePrice: number
  discount: number
  stock: number
  active: boolean
  createdAt: string
}

export default function ProductBundle() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [products, setProducts] = useState<Array<{ name: string; qty: number; price: number }>>([{ name: '', qty: 1, price: 0 }])
  const [bundlePrice, setBundlePrice] = useState(0)
  const [stock, setStock] = useState(0)

  useEffect(() => {
    setBundles(getFromStorage<Bundle[]>('umkm_bundles', []))
  }, [])

  const originalPrice = products.reduce((sum, p) => sum + (p.qty * p.price), 0)
  const discount = originalPrice > 0 ? ((originalPrice - bundlePrice) / originalPrice) * 100 : 0

  const handleSubmit = () => {
    if (!name || products.some(p => !p.name || p.price <= 0)) {
      alert('Lengkapi data bundle!')
      return
    }

    if (editingBundle) {
      const updated = bundles.map(b => b.id === editingBundle.id ? {
        ...b, name, description, products: products.filter(p => p.name),
        originalPrice, bundlePrice, discount, stock
      } : b)
      setBundles(updated)
      saveToStorage('umkm_bundles', updated)
    } else {
      const bundle: Bundle = {
        id: generateId(), name, description,
        products: products.filter(p => p.name),
        originalPrice, bundlePrice, discount, stock,
        active: true, createdAt: new Date().toISOString(),
      }
      const updated = [bundle, ...bundles]
      setBundles(updated)
      saveToStorage('umkm_bundles', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setName(''); setDescription(''); setProducts([{ name: '', qty: 1, price: 0 }])
    setBundlePrice(0); setStock(0); setShowForm(false); setEditingBundle(null)
  }

  const startEdit = (bundle: Bundle) => {
    setEditingBundle(bundle)
    setName(bundle.name); setDescription(bundle.description)
    setProducts(bundle.products.length > 0 ? bundle.products : [{ name: '', qty: 1, price: 0 }])
    setBundlePrice(bundle.bundlePrice); setStock(bundle.stock)
    setShowForm(true)
  }

  const toggleActive = (id: string) => {
    const updated = bundles.map(b => b.id === id ? { ...b, active: !b.active } : b)
    setBundles(updated)
    saveToStorage('umkm_bundles', updated)
  }

  const deleteBundle = (id: string) => {
    if (confirm('Hapus bundle ini?')) {
      const updated = bundles.filter(b => b.id !== id)
      setBundles(updated)
      saveToStorage('umkm_bundles', updated)
    }
  }

  const totalBundles = bundles.length
  const activeBundles = bundles.filter(b => b.active).length
  const totalSavings = bundles.reduce((sum, b) => sum + (b.originalPrice - b.bundlePrice), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Product Bundle</h2>
          <p className="text-slate-600 mt-1">Buat paket produk dengan harga spesial</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Buat Bundle'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="package" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Total Bundle</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalBundles}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Bundle Aktif</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeBundles}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Total Diskon</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalSavings)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">{editingBundle ? 'Edit Bundle' : 'Buat Bundle Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama Bundle *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Paket Hemat A"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Stok Bundle</label>
              <input type="number" value={stock || ''} onChange={e => setStock(parseInt(e.target.value) || 0)}
                placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Deskripsi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Deskripsi bundle..." rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-600">Produk dalam Bundle *</label>
              <button onClick={() => setProducts([...products, { name: '', qty: 1, price: 0 }])}
                className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Produk
              </button>
            </div>
            <div className="space-y-3">
              {products.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={p.name} onChange={e => { const n = [...products]; n[i].name = e.target.value; setProducts(n) }}
                    placeholder="Nama produk" className="col-span-5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={p.qty} onChange={e => { const n = [...products]; n[i].qty = parseInt(e.target.value) || 0; setProducts(n) }}
                    placeholder="Qty" min="1" className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={p.price || ''} onChange={e => { const n = [...products]; n[i].price = parseInt(e.target.value) || 0; setProducts(n) }}
                    placeholder="Harga" className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  {products.length > 1 && (
                    <button onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-400 text-xl">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 rounded-lg p-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Harga Normal</label>
              <p className="text-lg font-bold text-slate-900">{formatRupiah(originalPrice)}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Harga Bundle *</label>
              <input type="number" value={bundlePrice || ''} onChange={e => setBundlePrice(parseInt(e.target.value) || 0)}
                placeholder="0" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Diskon</label>
              <p className="text-lg font-bold text-emerald-600">{discount.toFixed(1)}%</p>
            </div>
          </div>
          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> {editingBundle ? 'Update' : 'Simpan'} Bundle
          </button>
        </div>
      )}

      {/* Bundle List */}
      <div className="space-y-3">
        {bundles.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="package" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada bundle. Buat bundle pertamamu!</p>
          </div>
        ) : (
          bundles.map(b => (
            <div key={b.id} className={`bg-white rounded-xl p-5 border shadow-sm transition-colors ${b.active ? 'border-slate-200' : 'border-slate-300 opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-slate-900">{b.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {b.active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  {b.description && <p className="text-sm text-slate-600 mb-2">{b.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {b.products.map((p, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 rounded text-slate-700">{p.name} x{p.qty}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 line-through">{formatRupiah(b.originalPrice)}</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatRupiah(b.bundlePrice)}</p>
                  <p className="text-sm text-emerald-600 font-semibold">Hemat {b.discount.toFixed(0)}%</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${b.active ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  {b.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => startEdit(b)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                  <Icon name="edit" size={14} />
                </button>
                <button onClick={() => deleteBundle(b.id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
