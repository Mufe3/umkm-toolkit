import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Voucher {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  maxDiscount: number
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  active: boolean
  description: string
}

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState(0)
  const [minPurchase, setMinPurchase] = useState(0)
  const [maxDiscount, setMaxDiscount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setVouchers(getFromStorage<Voucher[]>('umkm_vouchers', []))
  }, [])

  const handleSubmit = () => {
    if (!code || !name || !value) {
      alert('Lengkapi kode, nama, dan nilai voucher!')
      return
    }

    if (editingVoucher) {
      const updated = vouchers.map(v =>
        v.id === editingVoucher.id
          ? { ...v, code: code.toUpperCase(), name, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate, description }
          : v
      )
      setVouchers(updated)
      saveToStorage('umkm_vouchers', updated)
    } else {
      const voucher: Voucher = {
        id: generateId(),
        code: code.toUpperCase(),
        name, type, value, minPurchase, maxDiscount, usageLimit,
        usedCount: 0,
        startDate, endDate,
        active: true,
        description,
      }
      const updated = [voucher, ...vouchers]
      setVouchers(updated)
      saveToStorage('umkm_vouchers', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setCode(''); setName(''); setType('percentage'); setValue(0)
    setMinPurchase(0); setMaxDiscount(0); setUsageLimit(0)
    setStartDate(''); setEndDate(''); setDescription('')
    setShowForm(false); setEditingVoucher(null)
  }

  const startEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setCode(voucher.code); setName(voucher.name); setType(voucher.type)
    setValue(voucher.value); setMinPurchase(voucher.minPurchase)
    setMaxDiscount(voucher.maxDiscount); setUsageLimit(voucher.usageLimit)
    setStartDate(voucher.startDate); setEndDate(voucher.endDate)
    setDescription(voucher.description)
    setShowForm(true)
  }

  const toggleActive = (id: string) => {
    const updated = vouchers.map(v => v.id === id ? { ...v, active: !v.active } : v)
    setVouchers(updated)
    saveToStorage('umkm_vouchers', updated)
  }

  const deleteVoucher = (id: string) => {
    if (confirm('Hapus voucher ini?')) {
      const updated = vouchers.filter(v => v.id !== id)
      setVouchers(updated)
      saveToStorage('umkm_vouchers', updated)
    }
  }

  const isExpired = (voucher: Voucher) => {
    if (!voucher.endDate) return false
    return new Date(voucher.endDate) < new Date()
  }

  const isActive = (voucher: Voucher) => {
    if (!voucher.active) return false
    if (isExpired(voucher)) return false
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) return false
    return true
  }

  const activeVouchers = vouchers.filter(v => isActive(v)).length
  const expiredVouchers = vouchers.filter(v => isExpired(v)).length
  const totalUsage = vouchers.reduce((sum, v) => sum + v.usedCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Voucher & Promo</h2>
          <p className="text-slate-600 mt-1">Kelola voucher diskon dan promo untuk meningkatkan penjualan</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Buat Voucher'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="award" size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-slate-600">Total Voucher</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{vouchers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={16} className="text-emerald-500" />
            </div>
            <p className="text-xs text-slate-600">Aktif</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeVouchers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="x-circle" size={16} className="text-rose-500" />
            </div>
            <p className="text-xs text-slate-600">Expired</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{expiredVouchers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="target" size={16} className="text-violet-500" />
            </div>
            <p className="text-xs text-slate-600">Total Penggunaan</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalUsage}x</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingVoucher ? 'Edit Voucher' : 'Buat Voucher Baru'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Kode Voucher *</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)}
                placeholder="DISKON10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 uppercase" />
              <p className="text-xs text-slate-500 mt-1">Kode yang akan diinput customer</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama Voucher *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Diskon 10% Akhir Tahun"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tipe Diskon</label>
              <select value={type} onChange={e => setType(e.target.value as 'percentage' | 'fixed')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nilai Diskon *</label>
              <input type="number" value={value || ''} onChange={e => setValue(parseInt(e.target.value) || 0)}
                placeholder={type === 'percentage' ? '10' : '50000'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              <p className="text-xs text-slate-500 mt-1">{type === 'percentage' ? 'Dalam persen' : 'Dalam Rupiah'}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Maks Diskon (Rp)</label>
              <input type="number" value={maxDiscount || ''} onChange={e => setMaxDiscount(parseInt(e.target.value) || 0)}
                placeholder="100000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              <p className="text-xs text-slate-500 mt-1">Kosongkan jika tidak ada batas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Min. Pembelian (Rp)</label>
              <input type="number" value={minPurchase || ''} onChange={e => setMinPurchase(parseInt(e.target.value) || 0)}
                placeholder="100000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              <p className="text-xs text-slate-500 mt-1">Min. belanja untuk pakai voucher</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Batas Penggunaan</label>
              <input type="number" value={usageLimit || ''} onChange={e => setUsageLimit(parseInt(e.target.value) || 0)}
                placeholder="100" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              <p className="text-xs text-slate-500 mt-1">Kosongkan jika unlimited</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tanggal Berakhir</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Deskripsi</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Syarat & ketentuan voucher..." rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> {editingVoucher ? 'Update' : 'Simpan'} Voucher
          </button>
        </div>
      )}

      {/* Voucher List */}
      <div className="space-y-3">
        {vouchers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="award" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada voucher. Buat voucher pertamamu!</p>
          </div>
        ) : (
          vouchers.map(v => {
            const expired = isExpired(v)
            const active = isActive(v)
            return (
              <div key={v.id} className={`bg-white rounded-xl p-5 border shadow-sm transition-colors ${
                expired ? 'border-rose-200 bg-rose-50/30' : active ? 'border-emerald-200' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded">{v.code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        expired ? 'bg-rose-100 text-rose-600' : active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {expired ? 'EXPIRED' : active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">{v.name}</h4>
                    {v.description && <p className="text-sm text-slate-600 mt-1">{v.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      {v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {v.usedCount}{v.usageLimit > 0 ? `/${v.usageLimit}` : ''} digunakan
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                  {v.minPurchase > 0 && <span>Min. belanja: {formatRupiah(v.minPurchase)}</span>}
                  {v.maxDiscount > 0 && <span>Maks diskon: {formatRupiah(v.maxDiscount)}</span>}
                  {v.startDate && <span>Mulai: {formatDate(v.startDate)}</span>}
                  {v.endDate && <span>Berakhir: {formatDate(v.endDate)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      v.active ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                    }`}>
                    {v.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => startEdit(v)}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={() => deleteVoucher(v.id)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
