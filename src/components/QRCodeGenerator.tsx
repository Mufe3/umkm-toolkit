import { useState, useEffect, useRef } from 'react'
import { getFromStorage, formatRupiah } from '../utils/storage'
import QRCode from 'qrcode'

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

  // Generate QR for product
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
      color: { dark: '#1f2937', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(product)
  }

  // Generate QR for catalog
  const generateCatalogQR = async () => {
    if (!catalogUrl) {
      alert('Masukkan URL katalog terlebih dahulu!')
      return
    }
    const url = await QRCode.toDataURL(catalogUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1f2937', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(null)
  }

  // Generate QR for custom text
  const generateCustomQR = async () => {
    const text = customText || customUrl
    if (!text) {
      alert('Masukkan teks atau URL!')
      return
    }
    const url = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: { dark: '#1f2937', light: '#ffffff' },
    })
    setQrDataUrl(url)
    setSelectedProduct(null)
  }

  // Download QR
  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `qr-code-${selectedProduct?.name || 'custom'}-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
  }

  // Print QR
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
        <h2 className="text-3xl font-bold">🏷️ QR Code Generator</h2>
        <p className="text-gray-400 mt-1">Generate QR code untuk produk, katalog, atau custom</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden w-fit">
        <button onClick={() => setTab('product')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${tab === 'product' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          📦 Produk
        </button>
        <button onClick={() => setTab('catalog')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${tab === 'catalog' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🛍️ Katalog
        </button>
        <button onClick={() => setTab('custom')}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${tab === 'custom' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          ✏️ Custom
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {tab === 'product' && (
            <>
              <h3 className="text-xl font-bold mb-4">Pilih Produk</h3>
              {products.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Belum ada produk. Tambah produk di menu Inventory!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map(product => (
                    <button key={product.id} onClick={() => generateProductQR(product)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'bg-purple-600/20 border border-purple-500'
                          : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                      }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold">{product.name}</p>
                          <p className="text-sm text-gray-400">{product.category} • Stok: {product.stock} {product.unit}</p>
                        </div>
                        <p className="font-bold text-purple-400">{formatRupiah(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'catalog' && (
            <>
              <h3 className="text-xl font-bold mb-4">QR Katalog Online</h3>
              <p className="text-sm text-gray-400 mb-4">Masukkan URL katalog online kamu (bisa link website, Google Drive, dll)</p>
              <input type="url" value={catalogUrl} onChange={e => setCatalogUrl(e.target.value)}
                placeholder="https://katalog-kamu.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none mb-4" />
              <button onClick={generateCatalogQR}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform">
                🏷️ Generate QR Code
              </button>
            </>
          )}

          {tab === 'custom' && (
            <>
              <h3 className="text-xl font-bold mb-4">QR Code Custom</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Teks atau Pesan</label>
                  <textarea value={customText} onChange={e => { setCustomText(e.target.value); setCustomUrl('') }}
                    placeholder="Masukkan teks, nomor WA, atau informasi apapun..."
                    rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Atau URL</label>
                  <input type="url" value={customUrl} onChange={e => { setCustomUrl(e.target.value); setCustomText('') }}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
                </div>
                <button onClick={generateCustomQR}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform">
                  🏷️ Generate QR Code
                </button>
              </div>
            </>
          )}
        </div>

        {/* QR Preview Section */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <>
              <div className="bg-white rounded-xl p-4 mb-4">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              {selectedProduct && (
                <div className="text-center mb-4">
                  <p className="font-bold text-lg">{selectedProduct.name}</p>
                  <p className="text-purple-400">{formatRupiah(selectedProduct.price)}</p>
                  <p className="text-sm text-gray-400">{selectedProduct.category}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={downloadQR}
                  className="px-6 py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors">
                  💾 Download PNG
                </button>
                <button onClick={printQR}
                  className="px-6 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
                  🖨️ Print
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-5xl mb-4">🏷️</div>
              <p>Pilih produk atau masukkan data untuk generate QR code</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-purple-900/20 rounded-xl p-5 border border-purple-500/30">
        <h4 className="font-bold text-purple-400 mb-2">💡 Tips Penggunaan QR Code</h4>
        <ul className="text-sm text-gray-300 space-y-1">
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
