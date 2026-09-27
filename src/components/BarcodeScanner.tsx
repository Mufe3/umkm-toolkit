import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Product {
  id: string
  name: string
  barcode?: string
  price: number
  stock: number
  category: string
}

export default function BarcodeScanner() {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [scanResult, setScanResult] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [mode, setMode] = useState<'inventory' | 'pos'>('inventory')
  const [showScanner, setShowScanner] = useState(false)
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([])

  useEffect(() => {
    setProducts(getFromStorage<Product[]>('umkm_products', []))
  }, [])

  useEffect(() => {
    if (showScanner && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "barcode-scanner",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      html5QrcodeScanner.render(
        (decodedText) => {
          setScanResult(decodedText)
          handleScanResult(decodedText)
          html5QrcodeScanner.clear()
          setShowScanner(false)
          setScanner(null)
        },
        (error) => {
          console.warn(error)
        }
      )

      setScanner(html5QrcodeScanner)
    }

    return () => {
      if (scanner) {
        scanner.clear()
        setScanner(null)
      }
    }
  }, [showScanner])

  const handleScanResult = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    
    if (product) {
      if (mode === 'inventory') {
        // Update stock
        const action = confirm(`Produk: ${product.name}\nStok saat ini: ${product.stock}\n\nOK = Tambah stok\nCancel = Kurangi stok`)
        const updated = products.map(p =>
          p.id === product.id
            ? { ...p, stock: action ? p.stock + 1 : Math.max(0, p.stock - 1) }
            : p
        )
        setProducts(updated)
        saveToStorage('umkm_products', updated)
        alert(`Stok ${product.name} ${action ? 'ditambah' : 'dikurangi'}!`)
      } else {
        // Add to cart
        const existing = cart.find(item => item.product.id === product.id)
        if (existing) {
          setCart(cart.map(item =>
            item.product.id === product.id
              ? { ...item, qty: item.qty + 1 }
              : item
          ))
        } else {
          setCart([...cart, { product, qty: 1 }])
        }
      }
    } else {
      // Product not found
      if (mode === 'inventory') {
        const addNew = confirm(`Barcode "${barcode}" tidak ditemukan.\n\nTambah produk baru dengan barcode ini?`)
        if (addNew) {
          const name = prompt('Nama produk:')
          const price = prompt('Harga:')
          const stock = prompt('Stok awal:')
          const category = prompt('Kategori:') || 'Umum'

          if (name && price && stock) {
            const newProduct: Product = {
              id: generateId(),
              name,
              barcode,
              price: parseFloat(price),
              stock: parseInt(stock),
              category,
            }
            const updated = [newProduct, ...products]
            setProducts(updated)
            saveToStorage('umkm_products', updated)
            alert('Produk baru ditambahkan!')
          }
        }
      } else {
        alert(`Produk dengan barcode "${barcode}" tidak ditemukan!`)
      }
    }
  }

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, qty } : item
      ))
    }
  }

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0)

  const checkout = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!')
      return
    }

    // Create receipt
    const receipt = {
      id: generateId(),
      receiptNumber: `POS-${Date.now().toString().slice(-6)}`,
      customerName: 'Customer',
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.product.price,
      })),
      subtotal: total,
      discount: 0,
      tax: 0,
      total,
      paymentMethod: 'Cash',
      date: new Date().toISOString(),
      notes: 'Transaksi POS Barcode',
    }

    // Save receipt
    const receipts = getFromStorage<any[]>('umkm_receipts', [])
    saveToStorage('umkm_receipts', [receipt, ...receipts])

    // Update stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.product.id === p.id)
      if (cartItem) {
        return { ...p, stock: p.stock - cartItem.qty }
      }
      return p
    })
    setProducts(updatedProducts)
    saveToStorage('umkm_products', updatedProducts)

    // Create cash flow entry
    const transactions = getFromStorage<any[]>('umkm_transactions', [])
    const newTransaction = {
      id: generateId(),
      type: 'income',
      amount: total,
      category: 'Penjualan POS',
      description: `POS Barcode #${receipt.receiptNumber}`,
      date: receipt.date,
    }
    saveToStorage('umkm_transactions', [newTransaction, ...transactions])

    // Reset
    setCart([])
    alert(`Transaksi berhasil!\nNo: ${receipt.receiptNumber}\nTotal: ${formatRupiah(total)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Barcode Scanner</h2>
          <p className="text-slate-600 mt-1">Scan barcode untuk inventory atau POS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('inventory')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'inventory' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
            Inventory
          </button>
          <button onClick={() => setMode('pos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'pos' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
            POS
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === 'inventory' ? 'Scan untuk Update Stok' : 'Scan untuk Tambah ke Keranjang'}
          </h3>
          <button onClick={() => setShowScanner(!showScanner)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Icon name="eye" size={18} />
            {showScanner ? 'Tutup Scanner' : 'Buka Scanner'}
          </button>
        </div>

        {showScanner && (
          <div className="mb-4">
            <div id="barcode-scanner" className="rounded-lg overflow-hidden"></div>
          </div>
        )}

        {scanResult && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 font-semibold">Barcode Terdeteksi:</p>
            <p className="text-lg font-mono text-emerald-900">{scanResult}</p>
          </div>
        )}

        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            <strong>Cara penggunaan:</strong>
          </p>
          <ul className="text-sm text-slate-600 mt-2 space-y-1">
            <li>• Klik "Buka Scanner" untuk mengaktifkan kamera</li>
            <li>• Arahkan kamera ke barcode/QR code produk</li>
            <li>• Sistem akan otomatis mendeteksi dan memproses</li>
            <li>• Untuk inventory: Tambah/kurang stok</li>
            <li>• Untuk POS: Tambah ke keranjang belanja</li>
          </ul>
        </div>
      </div>

      {/* POS Cart */}
      {mode === 'pos' && cart.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Keranjang Belanja</h3>
          <div className="space-y-3 mb-4">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.product.name}</p>
                  <p className="text-sm text-slate-600">{formatRupiah(item.product.price)} x {item.qty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                    className="w-8 h-8 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{item.qty}</span>
                  <button onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                    className="w-8 h-8 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                    +
                  </button>
                  <p className="font-bold text-indigo-600 ml-4">{formatRupiah(item.product.price * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-slate-900">Total:</span>
              <span className="text-2xl font-bold text-indigo-600">{formatRupiah(total)}</span>
            </div>
            <button onClick={checkout}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Products without barcode */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Produk Tanpa Barcode ({products.filter(p => !p.barcode).length})
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Produk berikut belum memiliki barcode. Anda dapat menambahkan barcode dengan mengedit produk di menu Inventory.
        </p>
        <div className="space-y-2">
          {products.filter(p => !p.barcode).slice(0, 10).map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-600">{product.category} • Stok: {product.stock}</p>
              </div>
              <p className="font-bold text-indigo-600">{formatRupiah(product.price)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
