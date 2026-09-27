import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Debt {
  id: string
  type: 'receivable' | 'payable' // receivable = piutang (customer hutang ke kita), payable = hutang (kita hutang ke supplier)
  partyName: string
  partyId?: string
  invoiceNumber?: string
  amount: number
  paidAmount: number
  dueDate: string
  date: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  notes: string
}

export default function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid' | 'overdue'>('all')

  const [type, setType] = useState<'receivable' | 'payable'>('receivable')
  const [partyName, setPartyName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setDebts(getFromStorage<Debt[]>('umkm_debts', []))
  }, [])

  // Auto-check overdue debts
  useEffect(() => {
    const today = new Date()
    const updated = debts.map(debt => {
      if (debt.status !== 'paid' && debt.status !== 'overdue') {
        const due = new Date(debt.dueDate)
        if (due < today) {
          return { ...debt, status: 'overdue' as const }
        }
      }
      return debt
    })
    
    const hasChanges = updated.some((d, i) => d.status !== debts[i].status)
    if (hasChanges) {
      setDebts(updated)
      saveToStorage('umkm_debts', updated)
    }
  }, [debts])

  const handleSubmit = () => {
    if (!partyName || !amount || !dueDate) {
      alert('Lengkapi nama, jumlah, dan tanggal jatuh tempo!')
      return
    }

    const debt: Debt = {
      id: generateId(),
      type,
      partyName,
      invoiceNumber: invoiceNumber || undefined,
      amount,
      paidAmount,
      dueDate: new Date(dueDate).toISOString(),
      date: new Date().toISOString(),
      status: paidAmount >= amount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
      notes,
    }

    const updated = [debt, ...debts]
    setDebts(updated)
    saveToStorage('umkm_debts', updated)
    resetForm()
  }

  const resetForm = () => {
    setType('receivable'); setPartyName(''); setInvoiceNumber('')
    setAmount(0); setPaidAmount(0); setDueDate(''); setNotes('')
    setShowForm(false)
  }

  const addPayment = (id: string, paymentAmount: number) => {
    const debt = debts.find(d => d.id === id)
    if (!debt) return

    const newPaidAmount = debt.paidAmount + paymentAmount
    const newStatus = newPaidAmount >= debt.amount ? 'paid' : 'partial'

    const updated = debts.map(d =>
      d.id === id ? { ...d, paidAmount: newPaidAmount, status: newStatus as Debt['status'] } : d
    )
    setDebts(updated)
    saveToStorage('umkm_debts', updated)
  }

  const deleteDebt = (id: string) => {
    if (confirm('Hapus data hutang/piutang ini?')) {
      const updated = debts.filter(d => d.id !== id)
      setDebts(updated)
      saveToStorage('umkm_debts', updated)
    }
  }

  const filteredDebts = debts.filter(d => {
    const matchType = filter === 'all' || d.type === filter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchType && matchStatus
  })

  // Stats
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)
  const totalPayable = debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)
  const overdueReceivable = debts.filter(d => d.type === 'receivable' && d.status === 'overdue').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)
  const overduePayable = debts.filter(d => d.type === 'payable' && d.status === 'overdue').reduce((sum, d) => sum + (d.amount - d.paidAmount), 0)

  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    partial: 'bg-blue-50 text-blue-600 border-blue-200',
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    overdue: 'bg-rose-50 text-rose-600 border-rose-200',
  }

  const statusLabels = {
    pending: 'Belum Dibayar',
    partial: 'Sebagian',
    paid: 'Lunas',
    overdue: 'Jatuh Tempo',
  }

  const daysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Utang & Piutang</h2>
          <p className="text-slate-600 mt-1">Kelola hutang ke supplier dan piutang dari customer</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Tambah Data'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="trending-up" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Total Piutang</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalReceivable)}</p>
          <p className="text-xs text-slate-500 mt-1">Customer hutang ke Anda</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="trending-down" size={18} className="text-rose-500" />
            </div>
            <p className="text-sm text-slate-600">Total Hutang</p>
          </div>
          <p className="text-2xl font-bold text-rose-600">{formatRupiah(totalPayable)}</p>
          <p className="text-xs text-slate-500 mt-1">Anda hutang ke supplier</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="alert" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Piutang Overdue</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatRupiah(overdueReceivable)}</p>
          <p className="text-xs text-slate-500 mt-1">Melewati jatuh tempo</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Net Position</p>
          </div>
          <p className={`text-2xl font-bold ${totalReceivable - totalPayable >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(totalReceivable - totalPayable)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Piutang - Hutang</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'all', label: 'Semua' },
            { id: 'receivable', label: 'Piutang' },
            { id: 'payable', label: 'Hutang' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${filter === f.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
          {([
            { id: 'all', label: 'Semua Status' },
            { id: 'pending', label: 'Belum Bayar' },
            { id: 'partial', label: 'Sebagian' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'paid', label: 'Lunas' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-2 text-sm transition-colors ${statusFilter === f.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Tambah Data Hutang/Piutang</h3>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Tipe</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setType('receivable')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'receivable' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <Icon name="trending-up" size={24} className="mx-auto mb-2 text-emerald-600" />
                <p className="font-semibold text-slate-900">Piutang</p>
                <p className="text-xs text-slate-600">Customer hutang ke Anda</p>
              </button>
              <button onClick={() => setType('payable')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'payable' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <Icon name="trending-down" size={24} className="mx-auto mb-2 text-rose-600" />
                <p className="font-semibold text-slate-900">Hutang</p>
                <p className="text-xs text-slate-600">Anda hutang ke supplier</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nama {type === 'receivable' ? 'Customer' : 'Supplier'} *</label>
              <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)}
                placeholder={type === 'receivable' ? 'Nama customer' : 'Nama supplier'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">No. Invoice (Opsional)</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Jumlah Total (Rp) *</label>
              <input type="number" value={amount || ''} onChange={e => setAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Sudah Dibayar (Rp)</label>
              <input type="number" value={paidAmount || ''} onChange={e => setPaidAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Jatuh Tempo *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan..." rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan Data
          </button>
        </div>
      )}

      {/* Debt List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="dollar" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Tidak ada data hutang/piutang</p>
          </div>
        ) : (
          filteredDebts.map(debt => {
            const remaining = debt.amount - debt.paidAmount
            const daysLeft = daysUntilDue(debt.dueDate)
            const progress = (debt.paidAmount / debt.amount) * 100

            return (
              <div key={debt.id} className={`bg-white rounded-xl p-5 border shadow-sm ${
                debt.status === 'overdue' ? 'border-rose-200' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        debt.type === 'receivable' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {debt.type === 'receivable' ? 'PIUTANG' : 'HUTANG'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[debt.status]}`}>
                        {statusLabels[debt.status]}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">{debt.partyName}</h4>
                    {debt.invoiceNumber && <p className="text-sm text-slate-600">Invoice: {debt.invoiceNumber}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{formatRupiah(debt.amount)}</p>
                    <p className="text-sm text-slate-600">Sisa: {formatRupiah(remaining)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Terbayar: {formatRupiah(debt.paidAmount)}</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      debt.status === 'paid' ? 'bg-emerald-500' :
                      debt.status === 'overdue' ? 'bg-rose-500' :
                      'bg-indigo-500'
                    }`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                  <span>Jatuh tempo: {formatDate(debt.dueDate)}</span>
                  {debt.status !== 'paid' && (
                    <span className={daysLeft < 0 ? 'text-rose-600 font-semibold' : daysLeft <= 7 ? 'text-amber-600 font-semibold' : ''}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)} hari lewat` : daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                    </span>
                  )}
                </div>

                {debt.notes && <p className="text-sm text-slate-600 italic mb-3">{debt.notes}</p>}

                <div className="flex gap-2">
                  {debt.status !== 'paid' && (
                    <button onClick={() => {
                      const payment = prompt('Masukkan jumlah pembayaran:')
                      if (payment) {
                        const amount = parseFloat(payment)
                        if (amount > 0 && amount <= remaining) {
                          addPayment(debt.id, amount)
                        } else {
                          alert('Jumlah tidak valid!')
                        }
                      }
                    }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-1">
                      <Icon name="dollar" size={14} /> Catat Pembayaran
                    </button>
                  )}
                  <button onClick={() => deleteDebt(debt.id)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1 ml-auto">
                    <Icon name="trash" size={14} /> Hapus
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
