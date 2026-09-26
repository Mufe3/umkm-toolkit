import { useState } from 'react'
import { formatRupiah } from '../utils/storage'

export default function PriceCalculator() {
  const [hpp, setHpp] = useState(0) // Harga Pokok Produksi
  const [operationalCost, setOperationalCost] = useState(0) // Biaya operasional
  const [desiredMargin, setDesiredMargin] = useState(30) // Margin yang diinginkan (%)
  const [discount, setDiscount] = useState(0) // Diskon (%)
  const [ppn, setPpn] = useState(11) // PPN (%)
  const [competitorPrice, setCompetitorPrice] = useState(0) // Harga kompetitor

  const totalCost = hpp + operationalCost
  const basePrice = totalCost / (1 - desiredMargin / 100)
  const priceAfterDiscount = basePrice * (1 - discount / 100)
  const ppnAmount = priceAfterDiscount * (ppn / 100)
  const finalPrice = Math.round(priceAfterDiscount + ppnAmount)
  const profit = finalPrice - totalCost - ppnAmount
  const profitMargin = totalCost > 0 ? (profit / finalPrice) * 100 : 0

  const priceVsCompetitor = competitorPrice > 0
    ? ((finalPrice - competitorPrice) / competitorPrice) * 100
    : 0

  const recommendations = []
  if (profitMargin < 10) {
    recommendations.push({ type: 'warning', text: 'Margin keuntungan terlalu kecil! Pertimbangkan menaikkan harga.' })
  }
  if (profitMargin > 50) {
    recommendations.push({ type: 'info', text: 'Margin sangat tinggi. Pastikan harga masih kompetitif.' })
  }
  if (competitorPrice > 0 && priceVsCompetitor > 20) {
    recommendations.push({ type: 'warning', text: 'Harga kamu 20%+ lebih mahal dari kompetitor. Periksa value proposition.' })
  }
  if (competitorPrice > 0 && priceVsCompetitor < -20) {
    recommendations.push({ type: 'success', text: 'Harga kamu jauh lebih murah! Pastikan kualitas tetap terjaga.' })
  }
  if (desiredMargin < 20) {
    recommendations.push({ type: 'info', text: 'Margin di bawah 20% mungkin tidak cukup untuk menutup risiko bisnis.' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Kalkulator Harga</h2>
        <p className="text-gray-500 mt-1">Hitung harga jual optimal untuk produk Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📝</span> Input Data
          </h3>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Harga Pokok Produksi (HPP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={hpp || ''}
                onChange={e => setHpp(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Biaya bahan baku + tenaga kerja langsung</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Biaya Operasional
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={operationalCost || ''}
                onChange={e => setOperationalCost(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Listrik, sewa, transportasi, dll per unit</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Margin yang Diinginkan: {desiredMargin}%
            </label>
            <input
              type="range"
              min="5"
              max="80"
              value={desiredMargin}
              onChange={e => setDesiredMargin(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%</span>
              <span>30% (ideal)</span>
              <span>80%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Diskon (%)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">PPN (%)</label>
              <input
                type="number"
                value={ppn || ''}
                onChange={e => setPpn(parseInt(e.target.value) || 0)}
                placeholder="11"
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">
              Harga Kompetitor (Opsional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={competitorPrice || ''}
                onChange={e => setCompetitorPrice(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          {/* Main Result */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg shadow-indigo-200/50">
            <p className="text-white/80 mb-2">💡 Harga Jual yang Disarankan</p>
            <p className="text-4xl font-bold">
              {formatRupiah(finalPrice)}
            </p>
            <p className="text-white/70 mt-2 text-sm">per unit produk</p>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4 text-gray-900">📊 Rincian Perhitungan</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Total Biaya (HPP + Operasional)</span>
                <span className="font-bold">{formatRupiah(totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Harga Sebelum Diskon</span>
                <span className="font-bold">{formatRupiah(basePrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Diskon ({discount}%)</span>
                  <span className="font-bold text-green-400">-{formatRupiah(basePrice - priceAfterDiscount)}</span>
                </div>
              )}
              {ppn > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">PPN ({ppn}%)</span>
                  <span className="font-bold text-orange-400">+{formatRupiah(ppnAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Keuntungan per Unit</span>
                <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatRupiah(profit)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Margin Keuntungan</span>
                <span className={`font-bold ${profitMargin >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Competitor Comparison */}
          {competitorPrice > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="font-bold mb-4">📈 Perbandingan dengan Kompetitor</h3>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">Harga Kompetitor</span>
                <span className="font-bold">{formatRupiah(competitorPrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">Harga Kamu</span>
                <span className="font-bold">{formatRupiah(finalPrice)}</span>
              </div>
              <div className={`p-3 rounded-lg ${
                priceVsCompetitor > 0
                  ? 'bg-red-500/10 border border-red-500/30'
                  : 'bg-green-500/10 border border-green-500/30'
              }`}>
                <p className={`font-bold ${priceVsCompetitor > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {priceVsCompetitor > 0
                    ? `${priceVsCompetitor.toFixed(1)}% lebih MAHAL`
                    : `${Math.abs(priceVsCompetitor).toFixed(1)}% lebih MURAH`}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="font-bold mb-4">💡 Rekomendasi</h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      rec.type === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                        : rec.type === 'success'
                        ? 'bg-green-500/10 border-green-500/30 text-green-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <p className="text-sm">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
