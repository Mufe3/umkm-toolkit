import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  joinDate: string
  salary: number
  commissionRate: number
  status: 'active' | 'inactive'
}

interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  status: 'present' | 'late' | 'absent' | 'leave'
  notes: string
}

interface SalesCommission {
  id: string
  employeeId: string
  date: string
  salesAmount: number
  commission: number
  description: string
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [commissions, setCommissions] = useState<SalesCommission[]>([])
  const [tab, setTab] = useState<'employees' | 'attendance' | 'commission'>('employees')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [salary, setSalary] = useState(0)
  const [commissionRate, setCommissionRate] = useState(0)

  useEffect(() => {
    setEmployees(getFromStorage<Employee[]>('umkm_employees', []))
    setAttendance(getFromStorage<Attendance[]>('umkm_attendance', []))
    setCommissions(getFromStorage<SalesCommission[]>('umkm_commissions', []))
  }, [])

  const handleSubmit = () => {
    if (!name || !position) {
      alert('Nama dan posisi wajib diisi!')
      return
    }

    if (editingEmployee) {
      const updated = employees.map(e =>
        e.id === editingEmployee.id
          ? { ...e, name, position, phone, email, salary, commissionRate }
          : e
      )
      setEmployees(updated)
      saveToStorage('umkm_employees', updated)
    } else {
      const employee: Employee = {
        id: generateId(),
        name, position, phone, email,
        joinDate: new Date().toISOString(),
        salary, commissionRate,
        status: 'active',
      }
      const updated = [employee, ...employees]
      setEmployees(updated)
      saveToStorage('umkm_employees', updated)
    }
    resetForm()
  }

  const resetForm = () => {
    setName(''); setPosition(''); setPhone(''); setEmail('')
    setSalary(0); setCommissionRate(0)
    setShowForm(false); setEditingEmployee(null)
  }

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setName(employee.name); setPosition(employee.position)
    setPhone(employee.phone); setEmail(employee.email)
    setSalary(employee.salary); setCommissionRate(employee.commissionRate)
    setShowForm(true)
  }

  const toggleStatus = (id: string) => {
    const updated = employees.map(e =>
      e.id === id ? { ...e, status: (e.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' } : e
    )
    setEmployees(updated)
    saveToStorage('umkm_employees', updated)
  }

  const deleteEmployee = (id: string) => {
    if (confirm('Hapus karyawan ini?')) {
      const updated = employees.filter(e => e.id !== id)
      setEmployees(updated)
      saveToStorage('umkm_employees', updated)
    }
  }

  const handleCheckIn = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = attendance.find(a => a.employeeId === employeeId && a.date === today)
    
    if (existing) {
      alert('Sudah check-in hari ini!')
      return
    }

    const now = new Date()
    const checkInTime = now.toTimeString().split(' ')[0].substring(0, 5)
    const isLate = now.getHours() >= 9 // Late if after 9 AM

    const record: Attendance = {
      id: generateId(),
      employeeId,
      date: today,
      checkIn: checkInTime,
      checkOut: '',
      status: isLate ? 'late' : 'present',
      notes: '',
    }

    const updated = [record, ...attendance]
    setAttendance(updated)
    saveToStorage('umkm_attendance', updated)
  }

  const handleCheckOut = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const record = attendance.find(a => a.employeeId === employeeId && a.date === today)
    
    if (!record) {
      alert('Belum check-in!')
      return
    }

    if (record.checkOut) {
      alert('Sudah check-out!')
      return
    }

    const now = new Date()
    const checkOutTime = now.toTimeString().split(' ')[0].substring(0, 5)

    const updated = attendance.map(a =>
      a.id === record.id ? { ...a, checkOut: checkOutTime } : a
    )
    setAttendance(updated)
    saveToStorage('umkm_attendance', updated)
  }

  const addCommission = (employeeId: string, amount: number, description: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    const commission = (amount * employee.commissionRate) / 100

    const record: SalesCommission = {
      id: generateId(),
      employeeId,
      date: new Date().toISOString(),
      salesAmount: amount,
      commission,
      description,
    }

    const updated = [record, ...commissions]
    setCommissions(updated)
    saveToStorage('umkm_commissions', updated)
  }

  // Stats
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0])
  const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length
  const totalCommissionThisMonth = commissions
    .filter(c => {
      const date = new Date(c.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    .reduce((sum, c) => sum + c.commission, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Manajemen Karyawan</h2>
          <p className="text-slate-600 mt-1">Kelola karyawan, absensi, dan komisi penjualan</p>
        </div>
        {tab === 'employees' && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Icon name={showForm ? 'close' : 'plus'} size={18} />
            {showForm ? 'Batal' : 'Tambah Karyawan'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="users" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Total Karyawan</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeEmployees}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Hadir Hari Ini</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{presentToday}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Terlambat</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{todayAttendance.filter(a => a.status === 'late').length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={18} className="text-violet-500" />
            </div>
            <p className="text-sm text-slate-600">Komisi Bulan Ini</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCommissionThisMonth)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        {([
          { id: 'employees', label: 'Karyawan' },
          { id: 'attendance', label: 'Absensi' },
          { id: 'commission', label: 'Komisi' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {tab === 'employees' && (
        <div className="space-y-4">
          {showForm && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Posisi *</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)}
                    placeholder="Kasir, Admin, Manager, dll"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Telepon</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Gaji (Rp)</label>
                  <input type="number" value={salary || ''} onChange={e => setSalary(parseInt(e.target.value) || 0)}
                    placeholder="3000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Komisi (%)</label>
                  <input type="number" value={commissionRate || ''} onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)}
                    placeholder="5" step="0.1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
                </div>
              </div>
              <button onClick={handleSubmit}
                className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                <Icon name="check" size={18} /> {editingEmployee ? 'Update' : 'Simpan'} Karyawan
              </button>
            </div>
          )}

          <div className="space-y-3">
            {employees.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
                <div className="mb-4"><Icon name="users" size={48} className="text-slate-300 mx-auto" /></div>
                <p className="text-slate-600">Belum ada karyawan. Tambah karyawan pertamamu!</p>
              </div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">{emp.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.status === 'active' ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{emp.position}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        {emp.phone && <span>📱 {emp.phone}</span>}
                        {emp.email && <span>📧 {emp.email}</span>}
                        <span>📅 Bergabung: {formatDate(emp.joinDate)}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-slate-600">Gaji: <span className="font-semibold text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(emp.salary)}</span></span>
                        <span className="text-slate-600">Komisi: <span className="font-semibold text-indigo-600">{emp.commissionRate}%</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(emp.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          emp.status === 'active' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                        {emp.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button onClick={() => startEdit(emp)}
                        className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Absensi Hari Ini</h3>
            <div className="space-y-3">
              {employees.filter(e => e.status === 'active').map(emp => {
                const todayRecord = attendance.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0])
                return (
                  <div key={emp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-sm text-slate-600">{emp.position}</p>
                      {todayRecord && (
                        <p className="text-xs text-slate-500 mt-1">
                          Check-in: {todayRecord.checkIn} {todayRecord.checkOut && `• Check-out: ${todayRecord.checkOut}`}
                          {todayRecord.status === 'late' && <span className="text-amber-600 ml-2">(Terlambat)</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!todayRecord && (
                        <button onClick={() => handleCheckIn(emp.id)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                          Check In
                        </button>
                      )}
                      {todayRecord && !todayRecord.checkOut && (
                        <button onClick={() => handleCheckOut(emp.id)}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
                          Check Out
                        </button>
                      )}
                      {todayRecord?.checkOut && (
                        <span className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm">Selesai</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Commission Tab */}
      {tab === 'commission' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Catat Komisi Penjualan</h3>
            <div className="space-y-3">
              {employees.filter(e => e.status === 'active' && e.commissionRate > 0).map(emp => (
                <div key={emp.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <p className="text-sm text-slate-600">Komisi: {emp.commissionRate}%</p>
                    </div>
                    <button onClick={() => {
                      const amount = prompt('Masukkan jumlah penjualan:')
                      if (amount) {
                        const desc = prompt('Deskripsi (opsional):') || 'Penjualan'
                        addCommission(emp.id, parseFloat(amount), desc)
                      }
                    }}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
                      Catat Komisi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Komisi</h3>
            <div className="space-y-3">
              {commissions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Belum ada catatan komisi</p>
              ) : (
                commissions.slice(0, 20).map(comm => {
                  const emp = employees.find(e => e.id === comm.employeeId)
                  return (
                    <div key={comm.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900">{emp?.name || 'Unknown'}</p>
                        <p className="text-sm text-slate-600">{comm.description}</p>
                        <p className="text-xs text-slate-500">{formatDate(comm.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Penjualan: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(comm.salesAmount)}</p>
                        <p className="text-lg font-bold text-indigo-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(comm.commission)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
