import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

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

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
    const orders = getFromStorage<any[]>('umkm_purchase_orders', [])

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
        id: generateId(), name, phone, email, address, category, rating, notes,
        totalOrders: 0, totalSpent: 0, createdAt: new Date().toISOString(),
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

  if (viewSupplier) {
    const orders = getFromStorage<any[]>('umkm_purchase_orders', [])
    const supplierOrders = orders.filter(o => o.supplier === viewSupplier.name)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-6">
        <button onClick={() => setViewSupplier(null)} 
          className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
          <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
        </button>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{viewSupplier.name}</h2>
              <p className="text-slate-500">{viewSupplier.category || 'Belum ada kategori'}</p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={16} className={i < viewSupplier.rating ? 'text-amber-400' : 'text-slate-200'} filled={i < viewSupplier.rating} />
                ))}
              </div>
            </div>
            <button onClick={() => { setViewSupplier(null); startEdit(viewSupplier) }}
              className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 text-sm font-medium flex items-center gap-1">
              <Icon name="edit" size={14} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Total PO</p>
              <p className="text-2xl font-bold text-slate-800">{viewSupplier.totalOrders}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Total Pembelian</p>
              <p className="text-2xl font-bold text-indigo-600">{formatRupiah(viewSupplier.totalSpent)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Sejak</p>
              <p className="text-lg font-semibold text-slate-800">{formatDate(viewSupplier.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                <Icon name="phone" size={14} /> Telepon
              </p>
              <p className="text-slate-800">{viewSupplier.phone}</p>
            </div>
            {viewSupplier.email && (
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Icon name="mail" size={14} /> Email
                </p>
                <p className="text-slate-800">{viewSupplier.email}</p>
              </div>
            )}
            {viewSupplier.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                  <Icon name="location" size={14} /> Alamat
                </p>
                <p className="text-slate-800">{viewSupplier.address}</p>
              </div>
            )}
            {viewSupplier.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-1">Catatan</p>
                <p className="text-slate-800">{viewSupplier.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Icon name="clock" size={18} className="text-indigo-500" /> Riwayat Purchase Order
          </h3>
          {supplierOrders.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Belum ada PO dari supplier ini</p>
          ) : (
            <div className="space-y-3">
              {supplierOrders.map(o => (
                <div key={o.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{formatDate(o.date)}</p>
                    <p className="text-sm text-slate-500">Status: {o.status}</p>
                  </div>
                  <p className="font-bold text-indigo-600">{formatRupiah(o.total)}</p>
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
          <h2 className="text-2xl font-bold text-slate-800">Supplier Management</h2>
          <p className="text-slate-500 mt-1">Kelola database supplier bisnis Anda</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Tambah Supplier'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="supplier" size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-slate-500">Total Supplier</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={16} className="text-violet-500" />
            </div>
            <p className="text-xs text-slate-500">Total Pembelian</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(suppliers.reduce((s, sup) => s + sup.totalSpent, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="award" size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-500">Supplier Terbaik</p>
          </div>
          <p className="text-lg font-bold text-slate-800 truncate">
            {suppliers.length > 0 ? suppliers.reduce((best, s) => s.rating > best.rating ? s : best).name : '-'}
          </p>
        </div>
      </div>

      {/* Search */}
      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="Cari supplier..."
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama supplier"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Telepon *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@supplier.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Kategori</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Bahan baku, kemasan, dll"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Alamat</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap"
              rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Rating: {rating}/5</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setRating(r)} className="transition-transform hover:scale-110">
                  <Icon name="star" size={24} className={r <= rating ? 'text-amber-400' : 'text-slate-200'} filled={r <= rating} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan..."
              rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
          </div>
          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> {editingSupplier ? 'Update' : 'Simpan'} Supplier
          </button>
        </div>
      )}

      {/* Supplier List */}
      <div className="space-y-3">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="supplier" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">{searchTerm ? 'Tidak ada supplier yang cocok' : 'Belum ada supplier'}</p>
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <div key={s.id} onClick={() => setViewSupplier(s)}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-slate-800">{s.name}</h4>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon key={i} name="star" size={12} className={i < s.rating ? 'text-amber-400' : 'text-slate-200'} filled={i < s.rating} />
                      ))}
                    </div>
                  </div>
                  {s.category && <p className="text-sm text-indigo-500 mb-1">{s.category}</p>}
                  <div className="flex gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Icon name="phone" size={12} /> {s.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="purchase" size={12} /> {s.totalOrders} PO
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="dollar" size={12} /> {formatRupiah(s.totalSpent)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(s) }}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors text-slate-600">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSupplier(s.id) }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
