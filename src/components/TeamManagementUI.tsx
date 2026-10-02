import { Icon } from './Icon'

export default function TeamManagementUI() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
        <p className="text-slate-600 mt-1">Kelola tim dan hak akses untuk bisnis Anda</p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="users" size={18} className="text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600">Total Anggota</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon name="check-circle" size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-600">Aktif</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={18} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-600">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
      </div>

      {/* Invite Member */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="plus" size={18} className="text-indigo-500" />
          Undang Anggota Tim
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="email@contoh.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Role</label>
            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800">
              <option>Admin</option>
              <option>Manager</option>
              <option>Staff</option>
              <option>Viewer</option>
            </select>
          </div>
          <button className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="mail" size={18} /> Kirim Undangan
          </button>
        </div>
      </div>

      {/* Roles & Permissions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="shield" size={18} className="text-indigo-500" />
          Role & Hak Akses
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Icon name="award" size={20} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Admin</h4>
                <p className="text-sm text-slate-600">Akses penuh ke semua fitur</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Owner Only</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Icon name="users" size={20} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Manager</h4>
                <p className="text-sm text-slate-600">Kelola tim dan laporan</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Limited</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Icon name="edit" size={20} className="text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Staff</h4>
                <p className="text-sm text-slate-600">Input data dan transaksi</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">Basic</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon name="eye" size={20} className="text-slate-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Viewer</h4>
                <p className="text-sm text-slate-600">Hanya melihat data</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold">Read Only</span>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-indigo-700">Segera Hadir</span>
        </div>
        <p className="text-sm text-slate-700 text-center">
          Fitur Team Management sedang dalam pengembangan. Kami akan memberitahu Anda ketika sudah tersedia!
        </p>
      </div>
    </div>
  )
}
