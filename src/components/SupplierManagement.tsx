import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  notes: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

interface PurchaseOrder {
  id: string
  supplier: string
  total: number
  status: string
  date: string
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [rating, setRating] = useState(5)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = () => {
    const saved = getFromStorage<Supplier[]>('umkm_suppliers', [])
    const orders = getFromStorage<PurchaseOrder[]>('umkm_purchase_orders', [])

    const updated = saved.map(s => {
      const supplierOrders = orders.filter(o => o.supplier === s.name)
      return {
        ...s,
        totalOrders: supplierOrders.length,
        totalSpent: supplierOrders.reduce((sum, o) => sum + o.total, 0),
      }
    })
    setSuppliers(updated)
  }

  const handleSubmit = () => {
    if (!name || !phone) {
      alert('Nama dan telepon wajib diisi!')
      return
    }

    if (editingSupplier) {
      const updated = suppliers.map(s =>
        s.id === editingSupplier.id ? { ...s, name, phone, email, address, category, rating, notes } : s
      )
      setSuppliers(updated)
      saveToStorage('umkm_suppliers', updated)
    } else {
      const supplier: Supplier = {
        id: generateId(),
        name, phone, email, address, category, rating, notes,
        totalOrders: 0, totalSpent: 0,
        createdAt: new Date().toISOString(),
      }
      const updated = [supplier, ...suppliers]
      setSuppliers(updated)
      saveToStorage('umkm_suppliers', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setAddress('')
    setCategory(''); setRating(5); setNotes('')
    setShowForm(false); setEditingSupplier(null)
  }

  const startEdit = (s: Supplier) => {
    setEditingSupplier(s)
    setName(s.name); setPhone(s.phone); setEmail(s.email)
    setAddress(s.address); setCategory(s.category); setRating(s.rating); setNotes(s.notes)
    setShowForm(true)
  }

  const deleteSupplier = (id: string) => {
    if (confirm('Hapus supplier ini?')) {
      const updated = suppliers.filter(s => s.id !== id)
      setSuppliers(updated)
      saveToStorage('umkm_suppliers', updated)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Supplier Detail View
  if (viewSupplier) {
    const orders = getFromStorage<PurchaseOrder[]>('umkm_purchase_orders', [])
    const supplierOrders = orders.filter(o => o.supplier === viewSupplier.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-6">
        <button onClick={() => setViewSupplier(null)} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
          ← Kembali
        </button>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{viewSupplier.name}</h2>
              <p className="text-gray-400">{viewSupplier.category || 'Belum ada kategori'}</p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < viewSupplier.rating ? 'text-yellow-400' : 'text-gray-600'}>⭐</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setViewSupplier(null); startEdit(viewSupplier) }}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">✏️ Edit</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total PO</p>
              <p className="text-2xl font-bold">{viewSupplier.totalOrders}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Pembelian</p>
              <p className="text-2xl font-bold text-purple-400">{formatRupiah(viewSupplier.totalSpent)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Sejak</p>
              <p className="text-2xl font-bold">{formatDate(viewSupplier.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><p className="text-sm text-gray-400 mb-1">📱 Telepon</p><p className="text-lg">{viewSupplier.phone}</p></div>
            {viewSupplier.email && <div><p className="text-sm text-gray-400 mb-1">📧 Email</p><p className="text-lg">{viewSupplier.email}</p></div>}
            {viewSupplier.address && <div className="md:col-span-2"><p className="text-sm text-gray-400 mb-1">📍 Alamat</p><p className="text-lg">{viewSupplier.address}</p></div>}
            {viewSupplier.notes && <div className="md:col-span-2"><p className="text-sm text-gray-400 mb-1">📝 Catatan</p><p className="text-lg">{viewSupplier.notes}</p></div>}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-4">📋 Riwayat Purchase Order</h3>
          {supplierOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Belum ada PO dari supplier ini</p>
          ) : (
            <div className="space-y-3">
              {supplierOrders.map(o => (
                <div key={o.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{formatDate(o.date)}</p>
                    <p className="text-sm text-gray-400">Status: {o.status}</p>
                  </div>
                  <p className="font-bold text-purple-400">{formatRupiah(o.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">🏭 Supplier Management</h2>
          <p className="text-gray-400 mt-1">Kelola database supplier bisnis kamu</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30">
          {showForm ? 'Batal' : '+ Tambah Supplier'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Supplier</p>
          <p className="text-2xl font-bold">{suppliers.length}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Pembelian</p>
          <p className="text-2xl font-bold text-purple-400">{formatRupiah(suppliers.reduce((s, sup) => s + sup.totalSpent, 0))}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Supplier Terbaik</p>
          <p className="text-2xl font-bold text-yellow-400">
            {suppliers.length > 0 ? suppliers.reduce((best, s) => s.rating > best.rating ? s : best).name.slice(0, 15) : '-'}
          </p>
        </div>
      </div>

      {/* Search */}
      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="🔍 Cari supplier..."
        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-purple-500 focus:outline-none" />

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h3 className="text-xl font-bold">{editingSupplier ? '✏️ Edit Supplier' : '🏭 Tambah Supplier Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nama *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama supplier"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Telepon *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@supplier.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Kategori</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Bahan baku, kemasan, dll"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Alamat</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap"
              rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Rating: {rating}/5</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setRating(r)}
                  className={`text-2xl transition-transform hover:scale-125 ${r <= rating ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                  ⭐
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan..."
              rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none" />
          </div>
          <button onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/30">
            💾 {editingSupplier ? 'Update' : 'Simpan'} Supplier
          </button>
        </div>
      )}

      {/* Supplier List */}
      <div className="space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">🏭</div>
            <p className="text-gray-400">{searchTerm ? 'Tidak ada supplier yang cocok' : 'Belum ada supplier'}</p>
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <div key={s.id} onClick={() => setViewSupplier(s)}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold">{s.name}</h4>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < s.rating ? '' : 'opacity-20'}`}>⭐</span>
                      ))}
                    </div>
                  </div>
                  {s.category && <p className="text-sm text-purple-400 mb-1">{s.category}</p>}
                  <div className="flex gap-3 text-sm text-gray-400">
                    <span>📱 {s.phone}</span>
                    <span>📋 {s.totalOrders} PO</span>
                    <span>💰 {formatRupiah(s.totalSpent)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(s) }}
                    className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSupplier(s.id) }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
