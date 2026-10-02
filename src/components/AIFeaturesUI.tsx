import { Icon } from './Icon'

export default function AIFeaturesUI() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AI Assistant</h2>
        <p className="text-slate-600 mt-1">Asisten AI untuk membantu analisis dan keputusan bisnis</p>
      </div>

      {/* AI Chat Interface Mockup */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Icon name="brain" size={24} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">UMKM AI Assistant</h3>
            <p className="text-sm text-slate-600">Siap membantu analisis bisnis Anda</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon name="brain" size={16} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 mb-2">Halo! Saya AI Assistant UMKM Toolkit. Saya bisa membantu Anda dengan:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Analisis penjualan dan tren</li>
                <li>• Rekomendasi harga optimal</li>
                <li>• Prediksi stok dan inventory</li>
                <li>• Identifikasi pelanggan VIP</li>
                <li>• Saran strategi marketing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tanyakan sesuatu tentang bisnis Anda..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
          />
          <button className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors">
            <Icon name="arrow-up" size={18} />
          </button>
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="zap" size={18} className="text-indigo-500" />
          Fitur AI yang Akan Datang
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon name="trending-up" size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Sales Forecasting</h4>
              <p className="text-sm text-slate-600">Prediksi penjualan berdasarkan data historis</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Icon name="calculator" size={20} className="text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Smart Pricing</h4>
              <p className="text-sm text-slate-600">Rekomendasi harga optimal berdasarkan pasar</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Icon name="package" size={20} className="text-violet-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Inventory Prediction</h4>
              <p className="text-sm text-slate-600">Prediksi kebutuhan stok otomatis</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon name="star" size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Customer Insights</h4>
              <p className="text-sm text-slate-600">Analisis perilaku dan preferensi pelanggan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Insights */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="info" size={18} className="text-indigo-500" />
          Contoh Insight yang Bisa Didapat
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-start gap-3">
              <Icon name="trending-up" size={18} className="text-indigo-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Tren Penjualan</p>
                <p className="text-sm text-slate-700">"Penjualan produk A meningkat 25% dalam 7 hari terakhir. Pertimbangkan untuk menambah stok."</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <Icon name="calculator" size={18} className="text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Rekomendasi Harga</p>
                <p className="text-sm text-slate-700">"Berdasarkan analisis pasar, Anda bisa menaikkan harga produk B sebesar 10% tanpa mengurangi penjualan."</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <Icon name="alert" size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Peringatan Stok</p>
                <p className="text-sm text-slate-700">"Stok produk C akan habis dalam 5 hari berdasarkan tren penjualan saat ini. Segera lakukan restock."</p>
              </div>
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
          Fitur AI Assistant sedang dalam pengembangan. Kami akan memberitahu Anda ketika sudah tersedia!
        </p>
      </div>
    </div>
  )
}
