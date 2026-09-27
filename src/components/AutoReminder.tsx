import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Reminder {
  id: string
  type: 'invoice' | 'debt' | 'custom'
  targetName: string
  targetPhone?: string
  targetEmail?: string
  message: string
  dueDate: string
  amount?: number
  status: 'pending' | 'sent' | 'dismissed'
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  customerPhone?: string
  total: number
  dueDate: string
  status: 'paid' | 'unpaid'
}

interface Debt {
  id: string
  type: 'receivable' | 'payable'
  partyName: string
  amount: number
  paidAmount: number
  dueDate: string
  status: string
}

export default function AutoReminder() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [tab, setTab] = useState<'overview' | 'invoices' | 'debts' | 'custom'>('overview')

  // Custom reminder form
  const [targetName, setTargetName] = useState('')
  const [targetPhone, setTargetPhone] = useState('')
  const [message, setMessage] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    setReminders(getFromStorage<Reminder[]>('umkm_reminders', []))
    setInvoices(getFromStorage<Invoice[]>('umkm_invoices', []))
    setDebts(getFromStorage<Debt[]>('umkm_debts', []))
  }, [])

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid')
  const overdueInvoices = unpaidInvoices.filter(i => new Date(i.dueDate) < new Date())
  const upcomingInvoices = unpaidInvoices.filter(i => {
    const due = new Date(i.dueDate)
    const today = new Date()
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  const overdueDebts = debts.filter(d => d.type === 'receivable' && d.status === 'overdue')
  const upcomingDebts = debts.filter(d => {
    if (d.type !== 'receivable' || d.status === 'paid') return false
    const due = new Date(d.dueDate)
    const today = new Date()
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  const generateInvoiceMessage = (invoice: Invoice): string => {
    return `Halo *${invoice.customer}*! 👋\n\nKami ingin mengingatkan bahwa Invoice *${invoice.invoiceNumber}* sebesar *${formatRupiah(invoice.total)}* telah jatuh tempo pada tanggal *${formatDate(invoice.dueDate)}*.\n\nMohon segera melakukan pembayaran. Terima kasih atas perhatiannya! 🙏`
  }

  const generateDebtMessage = (debt: Debt): string => {
    const remaining = debt.amount - debt.paidAmount
    return `Halo *${debt.partyName}*! 👋\n\nKami ingin mengingatkan bahwa terdapat piutang sebesar *${formatRupiah(remaining)}* yang telah jatuh tempo pada tanggal *${formatDate(debt.dueDate)}*.\n\nMohon segera melakukan pembayaran. Terima kasih! 🙏`
  }

  const sendWhatsApp = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1)
    if (!cleanPhone.startsWith('62')) cleanPhone = '62' + cleanPhone
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank')
  }

  const sendEmail = (email: string, subject: string, body: string) => {
    const encoded = encodeURIComponent(body)
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encoded}`)
  }

  const handleSendReminder = (type: 'invoice' | 'debt', item: Invoice | Debt, method: 'whatsapp' | 'email') => {
    let message = ''
    let phone = ''
    let email = ''
    let name = ''
    let amount = 0

    if (type === 'invoice') {
      const invoice = item as Invoice
      message = generateInvoiceMessage(invoice)
      phone = invoice.customerPhone || ''
      name = invoice.customer
      amount = invoice.total
    } else {
      const debt = item as Debt
      message = generateDebtMessage(debt)
      name = debt.partyName
      amount = debt.amount - debt.paidAmount
    }

    if (method === 'whatsapp') {
      if (!phone) {
        const inputPhone = prompt(`Masukkan nomor WhatsApp ${name}:`)
        if (inputPhone) {
          sendWhatsApp(inputPhone, message)
        }
      } else {
        sendWhatsApp(phone, message)
      }
    } else {
      const inputEmail = prompt(`Masukkan email ${name}:`, email)
      if (inputEmail) {
        sendEmail(inputEmail, 'Pengingat Pembayaran', message)
      }
    }

    // Save reminder
    const reminder: Reminder = {
      id: generateId(),
      type,
      targetName: name,
      targetPhone: phone,
      targetEmail: email,
      message,
      dueDate: new Date().toISOString(),
      amount,
      status: 'sent',
      createdAt: new Date().toISOString(),
    }
    const updated = [reminder, ...reminders]
    setReminders(updated)
    saveToStorage('umkm_reminders', updated)
  }

  const handleCreateCustomReminder = () => {
    if (!targetName || !message) {
      alert('Lengkapi nama dan pesan!')
      return
    }

    const reminder: Reminder = {
      id: generateId(),
      type: 'custom',
      targetName,
      targetPhone,
      message,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const updated = [reminder, ...reminders]
    setReminders(updated)
    saveToStorage('umkm_reminders', updated)
    setTargetName(''); setTargetPhone(''); setMessage(''); setDueDate('')
    setShowCustomForm(false)
  }

  const sendCustomReminder = (reminder: Reminder) => {
    if (reminder.targetPhone) {
      sendWhatsApp(reminder.targetPhone, reminder.message)
    }
    const updated = reminders.map(r => r.id === reminder.id ? { ...r, status: 'sent' as const } : r)
    setReminders(updated)
    saveToStorage('umkm_reminders', updated)
  }

  const dismissReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r)
    setReminders(updated)
    saveToStorage('umkm_reminders', updated)
  }

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id)
    setReminders(updated)
    saveToStorage('umkm_reminders', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Auto Reminder</h2>
        <p className="text-slate-600 mt-1">Kirim pengingat pembayaran otomatis via WhatsApp & Email</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Icon name="alert" size={18} className="text-rose-500" />
            </div>
            <p className="text-sm text-slate-600">Invoice Overdue</p>
          </div>
          <p className="text-2xl font-bold text-rose-600">{overdueInvoices.length}</p>
          <p className="text-xs text-slate-500 mt-1">{formatRupiah(overdueInvoices.reduce((s, i) => s + i.total, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Jatuh Tempo 7 Hari</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{upcomingInvoices.length}</p>
          <p className="text-xs text-slate-500 mt-1">{formatRupiah(upcomingInvoices.reduce((s, i) => s + i.total, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Piutang Overdue</p>
          </div>
          <p className="text-2xl font-bold text-violet-600">{overdueDebts.length}</p>
          <p className="text-xs text-slate-500 mt-1">{formatRupiah(overdueDebts.reduce((s, d) => s + (d.amount - d.paidAmount), 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Reminder Terkirim</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{reminders.filter(r => r.status === 'sent').length}</p>
          <p className="text-xs text-slate-500 mt-1">Total keseluruhan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'invoices', label: 'Invoice' },
          { id: 'debts', label: 'Piutang' },
          { id: 'custom', label: 'Custom' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Overdue Invoices */}
          {overdueInvoices.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-rose-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Icon name="alert" size={20} className="text-rose-500" />
                Invoice Jatuh Tempo ({overdueInvoices.length})
              </h3>
              <div className="space-y-3">
                {overdueInvoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.customer}</p>
                      <p className="text-sm text-slate-600">{inv.invoiceNumber} • Jatuh tempo: {formatDate(inv.dueDate)}</p>
                      <p className="text-lg font-bold text-rose-600 mt-1">{formatRupiah(inv.total)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSendReminder('invoice', inv, 'whatsapp')}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1">
                        <Icon name="message-circle" size={14} /> WA
                      </button>
                      <button onClick={() => handleSendReminder('invoice', inv, 'email')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <Icon name="mail" size={14} /> Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Invoices */}
          {upcomingInvoices.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Icon name="clock" size={20} className="text-amber-500" />
                Jatuh Tempo 7 Hari ke Depan ({upcomingInvoices.length})
              </h3>
              <div className="space-y-3">
                {upcomingInvoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.customer}</p>
                      <p className="text-sm text-slate-600">{inv.invoiceNumber} • Jatuh tempo: {formatDate(inv.dueDate)}</p>
                      <p className="text-lg font-bold text-amber-600 mt-1">{formatRupiah(inv.total)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSendReminder('invoice', inv, 'whatsapp')}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1">
                        <Icon name="message-circle" size={14} /> WA
                      </button>
                      <button onClick={() => handleSendReminder('invoice', inv, 'email')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <Icon name="mail" size={14} /> Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overdueInvoices.length === 0 && upcomingInvoices.length === 0 && (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
              <div className="mb-4"><Icon name="check-circle" size={48} className="text-emerald-500 mx-auto" /></div>
              <p className="text-slate-600">Tidak ada invoice yang perlu diingatkan</p>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Semua Invoice Belum Lunas</h3>
          {unpaidInvoices.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
              <p className="text-slate-600">Semua invoice sudah lunas!</p>
            </div>
          ) : (
            unpaidInvoices.map(inv => {
              const daysLeft = Math.ceil((new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={inv.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.customer}</p>
                      <p className="text-sm text-slate-600">{inv.invoiceNumber}</p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">{formatRupiah(inv.total)}</p>
                      <p className={`text-sm mt-1 ${daysLeft < 0 ? 'text-rose-600 font-semibold' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} hari lewat` : daysLeft === 0 ? 'Jatuh tempo hari ini' : `${daysLeft} hari lagi`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSendReminder('invoice', inv, 'whatsapp')}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1">
                        <Icon name="message-circle" size={14} /> WhatsApp
                      </button>
                      <button onClick={() => handleSendReminder('invoice', inv, 'email')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1">
                        <Icon name="mail" size={14} /> Email
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Debts Tab */}
      {tab === 'debts' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Piutang Belum Lunas</h3>
          {[...overdueDebts, ...upcomingDebts].length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
              <p className="text-slate-600">Tidak ada piutang yang perlu diingatkan</p>
            </div>
          ) : (
            [...overdueDebts, ...upcomingDebts].map(debt => (
              <div key={debt.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{debt.partyName}</p>
                    <p className="text-lg font-bold text-violet-600 mt-1">{formatRupiah(debt.amount - debt.paidAmount)}</p>
                    <p className="text-sm text-slate-600">Jatuh tempo: {formatDate(debt.dueDate)}</p>
                  </div>
                  <button onClick={() => handleSendReminder('debt', debt, 'whatsapp')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1">
                    <Icon name="message-circle" size={14} /> Kirim Reminder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Tab */}
      {tab === 'custom' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Reminder Custom</h3>
            <button onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
              <Icon name={showCustomForm ? 'close' : 'plus'} size={16} />
              {showCustomForm ? 'Batal' : 'Buat Reminder'}
            </button>
          </div>

          {showCustomForm && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Nama Target *</label>
                  <input type="text" value={targetName} onChange={e => setTargetName(e.target.value)}
                    placeholder="Nama penerima"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">No. WhatsApp</label>
                  <input type="tel" value={targetPhone} onChange={e => setTargetPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Pesan Reminder *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Tulis pesan reminder..." rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Tanggal Kirim</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <button onClick={handleCreateCustomReminder}
                className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors">
                Simpan Reminder
              </button>
            </div>
          )}

          {/* Custom Reminders List */}
          <div className="space-y-3">
            {reminders.filter(r => r.type === 'custom').length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
                <p className="text-slate-600">Belum ada reminder custom</p>
              </div>
            ) : (
              reminders.filter(r => r.type === 'custom').map(reminder => (
                <div key={reminder.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{reminder.targetName}</p>
                      <p className="text-sm text-slate-600">{formatDate(reminder.createdAt)}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      reminder.status === 'sent' ? 'bg-emerald-50 text-emerald-600' :
                      reminder.status === 'dismissed' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {reminder.status === 'sent' ? 'TERKIRIM' : reminder.status === 'dismissed' ? 'DIBATALKAN' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mb-3">{reminder.message}</p>
                  <div className="flex gap-2">
                    {reminder.status === 'pending' && reminder.targetPhone && (
                      <button onClick={() => sendCustomReminder(reminder)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-1">
                        <Icon name="message-circle" size={14} /> Kirim
                      </button>
                    )}
                    {reminder.status === 'pending' && (
                      <button onClick={() => dismissReminder(reminder.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                        Batal
                      </button>
                    )}
                    <button onClick={() => deleteReminder(reminder.id)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1 ml-auto">
                      <Icon name="trash" size={14} /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
