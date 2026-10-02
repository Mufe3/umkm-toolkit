import { useState, useEffect, useRef } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import QRCode from 'qrcode'
import { Icon } from './Icon'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  unit: string
  category: string
}

export default function QRCodeGenerator() {
  const [products, setProducts] = useState<Product[]>([])
  const [tab, setTab] = useState<'product' | 'catalog' | 'custom'>('product')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [customText, setCustomText] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [catalogUrl, setCatalogUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setProducts(getFromStorage<Product[]>('umkm_products', []))
  }, [])

  const generateProductQR = async (product: Product) => {
    const data = JSON.stringify({
      name: product.name,
      price: formatRupiah(product.price),
      stock: product.stock,
      unit: product.unit,
      category: product.category,
    })
    const url = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(product)
  }

  const generateCatalogQR = async () => {
    if (!catalogUrl) {
      alert('Masukkan URL katalog terlebih dahulu!')
      return
    }
    const url = await QRCode.toDataURL(catalogUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(null)
  }

  const generateCustomQR = async () => {
    const text = customText || customUrl
    if (!text) {
      alert('Masukkan teks atau URL!')
      return
    }
    const url = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(null)
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qr-code-${selectedProduct?.name || 'custom'}-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
  }

  const printQR = () => {
    if (!qrDataUrl) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <img src="${qrDataUrl}" style="width:300px;height:300px;" />
            ${selectedProduct ? `<p style="font-size:18px;margin-top:10px;font-weight:bold;">${selectedProduct.name}</p><p style="color:#666;">${formatRupiah(selectedProduct.price)}</p>` : ''}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">QR Code Generator</h2>
        <p className="text-slate-500 mt-1">Generate QR code untuk produk, katalog, atau custom</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        <button onClick={() => setTab('product')}
          className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'product' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Icon name="package" size={16} /> Produk
        </button>
        <button onClick={() => setTab('catalog')}
          className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'catalog' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Icon name="analytics" size={16} /> Katalog
        </button>
        <button onClick={() => setTab('custom')}
          className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'custom' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Icon name="edit" size={16} /> Custom
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          {tab === 'product' && (
            <>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Icon name="package" size={18} className="text-indigo-500" /> Pilih Produk
              </h3>
              {products.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Belum ada produk. Tambah produk di menu Inventory!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map(product => (
                    <button key={product.id} onClick={() => generateProductQR(product)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800">{product.name}</p>
                          <p className="text-sm text-slate-500">{product.category} • Stok: {product.stock} {product.unit}</p>
                        </div>
                        <p className="font-bold text-indigo-600">{formatRupiah(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'catalog' && (
            <>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Icon name="analytics" size={18} className="text-indigo-500" /> QR Katalog Online
              </h3>
              <p className="text-sm text-slate-500 mb-4">Masukkan URL katalog online kamu (bisa link website, Google Drive, dll)</p>
              <input type="url" value={catalogUrl} onChange={e => setCatalogUrl(e.target.value)}
                placeholder="https://katalog-kamu.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800 mb-4" />
              <button onClick={generateCatalogQR}
                className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                <Icon name="qrcode" size={18} /> Generate QR Code
              </button>
            </>
          )}

          {tab === 'custom' && (
            <>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Icon name="edit" size={18} className="text-indigo-500" /> QR Code Custom
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Teks atau Pesan</label>
                  <textarea value={customText} onChange={e => { setCustomText(e.target.value); setCustomUrl('') }}
                    placeholder="Masukkan teks, nomor WA, atau informasi apapun..."
                    rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Atau URL</label>
                  <input type="url" value={customUrl} onChange={e => { setCustomUrl(e.target.value); setCustomText('') }}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
                </div>
                <button onClick={generateCustomQR}
                  className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                  <Icon name="qrcode" size={18} /> Generate QR Code
                </button>
              </div>
            </>
          )}
        </div>

        {/* QR Preview Section */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <>
              <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              {selectedProduct && (
                <div className="text-center mb-4">
                  <p className="font-bold text-lg text-slate-800">{selectedProduct.name}</p>
                  <p className="text-indigo-600">{formatRupiah(selectedProduct.price)}</p>
                  <p className="text-sm text-slate-500">{selectedProduct.category}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={downloadQR}
                  className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors font-medium flex items-center gap-2">
                  <Icon name="download" size={16} /> Download PNG
                </button>
                <button onClick={printQR}
                  className="px-6 py-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg hover:bg-sky-100 transition-colors font-medium flex items-center gap-2">
                  <Icon name="print" size={16} /> Print
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <div className="mb-4">
                <Icon name="qrcode" size={48} className="text-slate-300 mx-auto" />
              </div>
              <p className="text-slate-500">Pilih produk atau masukkan data untuk generate QR code</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
        <h4 className="font-semibold text-indigo-700 mb-2 flex items-center gap-2">
          <Icon name="info" size={16} /> Tips Penggunaan QR Code
        </h4>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>• Tempel QR produk di rak untuk memudahkan scan harga</li>
          <li>• Cetak QR katalog di struk/brosur untuk akses cepat</li>
          <li>• Gunakan QR custom untuk link WhatsApp, Instagram, atau website</li>
          <li>• Print QR dalam ukuran minimal 2x2 cm agar mudah discan</li>
          <li>• Test QR code sebelum dicetak massal</li>
        </ul>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
