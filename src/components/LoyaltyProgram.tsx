import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface LoyaltyMember {
  id: string
  name: string
  phone: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  joinDate: string
  totalSpent: number
}

interface PointTransaction {
  id: string
  memberId: string
  type: 'earn' | 'redeem'
  points: number
  description: string
  date: string
}

export default function LoyaltyProgram() {
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPointsForm, setShowPointsForm] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [pointType, setPointType] = useState<'earn' | 'redeem'>('earn')
  const [points, setPoints] = useState(0)
  const [description, setDescription] = useState('')

  useEffect(() => {
    setMembers(getFromStorage<LoyaltyMember[]>('umkm_loyalty_members', []))
    setPointTransactions(getFromStorage<PointTransaction[]>('umkm_point_transactions', []))
  }, [])

  const calculateTier = (totalSpent: number): LoyaltyMember['tier'] => {
    if (totalSpent >= 10000000) return 'platinum'
    if (totalSpent >= 5000000) return 'gold'
    if (totalSpent >= 2000000) return 'silver'
    return 'bronze'
  }

  const tierColors = {
    bronze: 'bg-amber-100 text-amber-700 border-amber-300',
    silver: 'bg-slate-100 text-slate-700 border-slate-300',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    platinum: 'bg-violet-100 text-violet-700 border-violet-300',
  }

  const tierBenefits = {
    bronze: '1 poin per Rp10.000',
    silver: '1.5 poin per Rp10.000',
    gold: '2 poin per Rp10.000',
    platinum: '3 poin per Rp10.000',
  }

  const handleAddMember = () => {
    if (!name || !phone) {
      alert('Lengkapi data member!')
      return
    }
    const member: LoyaltyMember = {
      id: generateId(), name, phone, points: 0,
      tier: 'bronze', joinDate: new Date().toISOString(), totalSpent: 0,
    }
    const updated = [member, ...members]
    setMembers(updated)
    saveToStorage('umkm_loyalty_members', updated)
    setName(''); setPhone(''); setShowForm(false)
  }

  const handlePointsTransaction = () => {
    if (!selectedMember || !points) {
      alert('Pilih member dan masukkan jumlah poin!')
      return
    }
    const member = members.find(m => m.id === selectedMember)
    if (!member) return

    if (pointType === 'redeem' && member.points < points) {
      alert('Poin tidak cukup!')
      return
    }

    const transaction: PointTransaction = {
      id: generateId(), memberId: selectedMember,
      type: pointType, points, description,
      date: new Date().toISOString(),
    }

    const updatedTransactions = [transaction, ...pointTransactions]
    setPointTransactions(updatedTransactions)
    saveToStorage('umkm_point_transactions', updatedTransactions)

    const updatedMembers = members.map(m => {
      if (m.id === selectedMember) {
        const newPoints = pointType === 'earn' ? m.points + points : m.points - points
        const newTotalSpent = pointType === 'earn' ? m.totalSpent + (points * 10000) : m.totalSpent
        return { ...m, points: newPoints, totalSpent: newTotalSpent, tier: calculateTier(newTotalSpent) }
      }
      return m
    })
    setMembers(updatedMembers)
    saveToStorage('umkm_loyalty_members', updatedMembers)

    setSelectedMember(''); setPoints(0); setDescription(''); setShowPointsForm(false)
  }

  const deleteMember = (id: string) => {
    if (confirm('Hapus member ini?')) {
      const updated = members.filter(m => m.id !== id)
      setMembers(updated)
      saveToStorage('umkm_loyalty_members', updated)
    }
  }

  const totalPoints = members.reduce((sum, m) => sum + m.points, 0)
  const platinumMembers = members.filter(m => m.tier === 'platinum').length
  const goldMembers = members.filter(m => m.tier === 'gold').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Loyalty Program</h2>
          <p className="text-slate-600 mt-1">Sistem poin dan reward untuk pelanggan setia</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPointsForm(!showPointsForm)}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2">
            <Icon name="star" size={18} /> {showPointsForm ? 'Batal' : 'Kelola Poin'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Icon name={showForm ? 'close' : 'plus'} size={18} />
            {showForm ? 'Batal' : 'Tambah Member'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="users" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Total Member</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{members.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="star" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Total Poin</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Icon name="award" size={18} className="text-yellow-600" />
            </div>
            <p className="text-sm text-slate-600">Gold Members</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{goldMembers}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="award" size={18} className="text-violet-600" />
            </div>
            <p className="text-sm text-slate-600">Platinum Members</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{platinumMembers}</p>
        </div>
      </div>

      {/* Tier Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="award" size={18} className="text-indigo-500" /> Tier Membership
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="award" size={16} className="text-amber-700" />
              <p className="font-bold text-amber-700">Bronze</p>
            </div>
            <p className="text-xs text-slate-600">Spending: &lt; Rp2jt</p>
            <p className="text-xs text-slate-600 mt-1">{tierBenefits.bronze}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-300">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="award" size={16} className="text-slate-700" />
              <p className="font-bold text-slate-700">Silver</p>
            </div>
            <p className="text-xs text-slate-600">Spending: Rp2jt-5jt</p>
            <p className="text-xs text-slate-600 mt-1">{tierBenefits.silver}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="award" size={16} className="text-yellow-700" />
              <p className="font-bold text-yellow-700">Gold</p>
            </div>
            <p className="text-xs text-slate-600">Spending: Rp5jt-10jt</p>
            <p className="text-xs text-slate-600 mt-1">{tierBenefits.gold}</p>
          </div>
          <div className="p-4 bg-violet-50 rounded-lg border border-violet-300">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="award" size={16} className="text-violet-700" />
              <p className="font-bold text-violet-700">Platinum</p>
            </div>
            <p className="text-xs text-slate-600">Spending: &gt; Rp10jt</p>
            <p className="text-xs text-slate-600 mt-1">{tierBenefits.platinum}</p>
          </div>
        </div>
      </div>

      {/* Points Form */}
      {showPointsForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Kelola Poin Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Pilih Member</label>
              <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option value="">Pilih member...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.points} poin)</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Tipe Transaksi</label>
              <select value={pointType} onChange={e => setPointType(e.target.value as 'earn' | 'redeem')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                <option value="earn">Tambah Poin (Earn)</option>
                <option value="redeem">Tukar Poin (Redeem)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Jumlah Poin</label>
              <input type="number" value={points || ''} onChange={e => setPoints(parseInt(e.target.value) || 0)}
                placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Keterangan</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Belanja, tukar hadiah, dll" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <button onClick={handlePointsTransaction}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan Transaksi Poin
          </button>
        </div>
      )}

      {/* Add Member Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Tambah Member Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Nama member" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">No. Telepon *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>
          <button onClick={handleAddMember}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Tambah Member
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="users" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada member. Tambah member pertamamu!</p>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-slate-900">{m.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierColors[m.tier]}`}>
                      {m.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Icon name="phone" size={12} /> {m.phone}</span>
                    <span className="flex items-center gap-1"><Icon name="star" size={12} /> {m.points.toLocaleString()} poin</span>
                    <span className="flex items-center gap-1"><Icon name="dollar" size={12} /> Total: {formatRupiah(m.totalSpent)}</span>
                  </div>
                </div>
                <button onClick={() => deleteMember(m.id)}
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
