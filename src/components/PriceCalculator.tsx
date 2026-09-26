import { useState } from 'react'
import { formatRupiah } from '../utils/storage'
import { Icon } from './Icon'

export default function PriceCalculator() {
  const [hpp, setHpp] = useState(0)
  const [operationalCost, setOperationalCost] = useState(0)
  const [desiredMargin, setDesiredMargin] = useState(30)
  const [discount, setDiscount] = useState(0)
  const [ppn, setPpn] = useState(11)
  const [competitorPrice, setCompetitorPrice] = useState(0)

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
    recommendations.push({ type: 'warning', text: 'Harga kamu 20%+ lebih mahal dari kompetitor.' })
  }
  if (competitorPrice > 0 && priceVsCompetitor < -20) {
    recommendations.push({ type: 'success', text: 'Harga kamu jauh lebih murah! Pastikan kualitas terjaga.' })
  }
  if (desiredMargin < 20) {
    recommendations.push({ type: 'info', text: 'Margin di bawah 20% mungkin tidak cukup untuk menutup risiko.' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Kalkulator Harga</h2>
        <p className="text-slate-500 mt-1">Hitung harga jual optimal untuk produk Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="edit" size={18} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Input Data</h3>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Harga Pokok Produksi (HPP) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={hpp || ''}
                onChange={e => setHpp(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Biaya bahan baku + tenaga kerja langsung</p>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Biaya Operasional</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={operationalCost || ''}
                onChange={e => setOperationalCost(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Listrik, sewa, transportasi, dll per unit</p>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Margin yang Diinginkan: {desiredMargin}%</label>
            <input
              type="range"
              min="5"
              max="80"
              value={desiredMargin}
              onChange={e => setDesiredMargin(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5%</span>
              <span>30% (ideal)</span>
              <span>80%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Diskon (%)</label>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 mb-1 block">PPN (%)</label>
              <input
                type="number"
                value={ppn || ''}
                onChange={e => setPpn(parseInt(e.target.value) || 0)}
                placeholder="11"
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Harga Kompetitor (Opsional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
              <input
                type="number"
                value={competitorPrice || ''}
                onChange={e => setCompetitorPrice(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-4">
          {/* Main Result */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100">
            <p className="text-slate-500 mb-2 flex items-center gap-2">
              <Icon name="target" size={16} className="text-indigo-500" /> Harga Jual yang Disarankan
            </p>
            <p className="text-4xl font-bold text-indigo-600">
              {formatRupiah(finalPrice)}
            </p>
            <p className="text-slate-500 mt-2 text-sm">per unit produk</p>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="info" size={18} className="text-indigo-500" />
              <h3 className="font-semibold text-slate-800">Rincian Perhitungan</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Biaya (HPP + Operasional)</span>
                <span className="font-semibold text-slate-700">{formatRupiah(totalCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Harga Sebelum Diskon</span>
                <span className="font-semibold text-slate-700">{formatRupiah(basePrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Diskon ({discount}%)</span>
                  <span className="font-semibold text-emerald-600">-{formatRupiah(basePrice - priceAfterDiscount)}</span>
                </div>
              )}
              {ppn > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">PPN ({ppn}%)</span>
                  <span className="font-semibold text-amber-600">+{formatRupiah(ppnAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Keuntungan per Unit</span>
                <span className={`font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatRupiah(profit)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Margin Keuntungan</span>
                <span className={`font-semibold ${profitMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Competitor Comparison */}
          {competitorPrice > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="trending-up" size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-slate-800">Perbandingan dengan Kompetitor</h3>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500">Harga Kompetitor</span>
                <span className="font-semibold text-slate-700">{formatRupiah(competitorPrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500">Harga Kamu</span>
                <span className="font-semibold text-slate-700">{formatRupiah(finalPrice)}</span>
              </div>
              <div className={`p-3 rounded-lg ${
                priceVsCompetitor > 0
                  ? 'bg-rose-50 border border-rose-100'
                  : 'bg-emerald-50 border border-emerald-100'
              }`}>
                <p className={`font-semibold ${priceVsCompetitor > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {priceVsCompetitor > 0
                    ? `${priceVsCompetitor.toFixed(1)}% lebih MAHAL`
                    : `${Math.abs(priceVsCompetitor).toFixed(1)}% lebih MURAH`}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="info" size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-slate-800">Rekomendasi</h3>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      rec.type === 'warning'
                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                        : rec.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-sky-50 border-sky-100 text-sky-700'
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
