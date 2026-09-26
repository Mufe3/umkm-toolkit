import { Icon } from './Icon'

export default function MarketplaceUI() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Marketplace Integration</h2>
        <p className="text-slate-600 mt-1">Integrasi dengan marketplace populer untuk perluasan bisnis</p>
      </div>

      {/* Connected Marketplaces */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="purchase" size={18} className="text-indigo-500" />
          Marketplace Terhubung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Tokopedia</h4>
                <p className="text-sm text-slate-600">Belum terhubung</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              Hubungkan
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Shopee</h4>
                <p className="text-sm text-slate-600">Belum terhubung</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              Hubungkan
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Lazada</h4>
                <p className="text-sm text-slate-600">Belum terhubung</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              Hubungkan
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Bukalapak</h4>
                <p className="text-sm text-slate-600">Belum terhubung</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
              Hubungkan
            </button>
          </div>
        </div>
      </div>

      {/* Integration Features */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="zap" size={18} className="text-indigo-500" />
          Fitur Integrasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon name="package" size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Sync Stok Otomatis</h4>
              <p className="text-sm text-slate-600">Stok tersinkronisasi di semua marketplace</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Icon name="purchase" size={20} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Import Order</h4>
              <p className="text-sm text-slate-600">Order dari marketplace otomatis masuk</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Icon name="trending-up" size={20} className="text-violet-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Laporan Terintegrasi</h4>
              <p className="text-sm text-slate-600">Laporan penjualan dari semua marketplace</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon name="bell" size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Notifikasi Real-time</h4>
              <p className="text-sm text-slate-600">Pemberitahuan order baru langsung</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="award" size={18} className="text-indigo-500" />
          Keuntungan Integrasi
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
            <Icon name="check-circle" size={18} className="text-indigo-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Jangkauan Lebih Luas</p>
              <p className="text-sm text-slate-700">Produk Anda tersedia di berbagai marketplace populer</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
            <Icon name="check-circle" size={18} className="text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Efisiensi Waktu</p>
              <p className="text-sm text-slate-700">Kelola semua marketplace dari satu dashboard</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-lg">
            <Icon name="check-circle" size={18} className="text-violet-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Data Terpusat</p>
              <p className="text-sm text-slate-700">Semua data penjualan dan stok dalam satu tempat</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
            <Icon name="check-circle" size={18} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">Peningkatan Penjualan</p>
              <p className="text-sm text-slate-700">Akses ke jutaan calon pelanggan di marketplace</p>
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
          Fitur Marketplace Integration sedang dalam pengembangan. Kami akan memberitahu Anda ketika sudah tersedia!
        </p>
      </div>
    </div>
  )
}
