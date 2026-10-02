import { Icon } from './Icon'

export default function CloudSyncUI() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cloud Sync</h2>
        <p className="text-slate-600 mt-1">Sinkronisasi data antar device secara real-time</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="cloud" size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Status Sinkronisasi</h3>
              <p className="text-sm text-slate-600">Terakhir sync: Belum pernah</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-700">Belum Terhubung</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="info" size={16} className="text-slate-500" />
            <p className="text-sm text-slate-700">Hubungkan akun cloud untuk mulai sinkronisasi data</p>
          </div>
        </div>

        <button className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
          <Icon name="cloud" size={18} /> Hubungkan Cloud Storage
        </button>
      </div>

      {/* Features Preview */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="zap" size={18} className="text-indigo-500" />
          Fitur Cloud Sync
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon name="cloud" size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Real-time Sync</h4>
              <p className="text-sm text-slate-600">Data tersinkronisasi otomatis di semua device</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Icon name="check-circle" size={20} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Backup Otomatis</h4>
              <p className="text-sm text-slate-600">Backup data setiap hari ke cloud storage</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Icon name="users" size={20} className="text-violet-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Multi-Device</h4>
              <p className="text-sm text-slate-600">Akses data dari laptop, tablet, atau HP</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon name="shield" size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Keamanan Terjamin</h4>
              <p className="text-sm text-slate-600">Enkripsi end-to-end untuk data Anda</p>
            </div>
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
          Fitur Cloud Sync sedang dalam pengembangan. Kami akan memberitahu Anda ketika sudah tersedia!
        </p>
      </div>
    </div>
  )
}
