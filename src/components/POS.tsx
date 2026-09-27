import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  image?: string
}

interface CartItem {
  product: Product
  qty: number
  discount: number
}

interface Customer {
  id: string
  name: string
  phone: string
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [heldCarts, setHeldCarts] = useState<Array<{ id: string; items: CartItem[]; customer: Customer | null; date: string }>>([])

  useEffect(() => {
    setProducts(getFromStorage<Product[]>('umkm_products', []))
    setCustomers(getFromStorage<Customer[]>('umkm_customers', []))
  }, [])

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Stok habis!')
      return
    }

    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) {
        alert('Stok tidak cukup!')
        return
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, qty: 1, discount: 0 }])
    }
  }

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }
    const product = products.find(p => p.id === productId)
    if (product && qty > product.stock) {
      alert('Stok tidak cukup!')
      return
    }
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, qty } : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, discount } : item
    ))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0)
  const itemDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
  const totalDiscount = itemDiscount + (subtotal * discount / 100)
  const total = subtotal - totalDiscount

  const holdCart = () => {
    if (cart.length === 0) return
    const heldCart = {
      id: generateId(),
      items: cart,
      customer: selectedCustomer,
      date: new Date().toISOString(),
    }
    setHeldCarts([...heldCarts, heldCart])
    setCart([])
    setSelectedCustomer(null)
    setDiscount(0)
  }

  const recallCart = (id: string) => {
    const held = heldCarts.find(h => h.id === id)
    if (held) {
      setCart(held.items)
      setSelectedCustomer(held.customer)
      setHeldCarts(heldCarts.filter(h => h.id !== id))
    }
  }

  const deleteHeldCart = (id: string) => {
    setHeldCarts(heldCarts.filter(h => h.id !== id))
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang kosong!')
      return
    }

    // Create receipt
    const receipt: any = {
      id: generateId(),
      receiptNumber: `POS-${Date.now().toString().slice(-6)}`,
      storeName: getFromStorage<any>('umkm_store_settings', { storeName: 'Toko Saya' }).storeName,
      storeAddress: getFromStorage<any>('umkm_store_settings', { storeAddress: '' }).storeAddress,
      storePhone: getFromStorage<any>('umkm_store_settings', { storePhone: '' }).storePhone,
      customerName: selectedCustomer?.name || 'Customer',
      customerId: selectedCustomer?.id,
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.product.price,
      })),
      subtotal,
      discount: totalDiscount,
      tax: 0,
      total,
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Kartu' : paymentMethod === 'qris' ? 'QRIS' : 'E-Wallet',
      date: new Date().toISOString(),
      notes: 'Transaksi POS',
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
      description: `POS #${receipt.receiptNumber} - ${selectedCustomer?.name || 'Customer'}`,
      date: receipt.date,
      customerId: selectedCustomer?.id,
    }
    saveToStorage('umkm_transactions', [newTransaction, ...transactions])

    // Auto-earn loyalty points
    if (selectedCustomer?.id) {
      const loyaltyMembers = getFromStorage<any[]>('umkm_loyalty_members', [])
      const member = loyaltyMembers.find((m: any) => m.id === selectedCustomer.id)
      if (member) {
        const earnedPoints = Math.floor(total / 10000)
        member.points += earnedPoints
        member.totalSpent += total
        
        if (member.totalSpent >= 10000000) member.tier = 'platinum'
        else if (member.totalSpent >= 5000000) member.tier = 'gold'
        else if (member.totalSpent >= 2000000) member.tier = 'silver'
        
        saveToStorage('umkm_loyalty_members', loyaltyMembers)
      }
    }

    // Reset
    setCart([])
    setSelectedCustomer(null)
    setDiscount(0)
    setShowCheckout(false)
    setPaymentMethod('cash')

    alert(`Transaksi berhasil!\n\nNo: ${receipt.receiptNumber}\nTotal: ${formatRupiah(total)}\n\nStruk otomatis tersimpan.`)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col">
        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none text-slate-800"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 shadow-sm overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="package" size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Tidak ada produk</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    product.stock <= 0
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer'
                  }`}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-24 object-cover rounded mb-2" />
                  ) : (
                    <div className="w-full h-24 bg-slate-100 rounded mb-2 flex items-center justify-center">
                      <Icon name="package" size={32} className="text-slate-300" />
                    </div>
                  )}
                  <p className="font-semibold text-slate-800 text-sm line-clamp-2">{product.name}</p>
                  <p className="text-indigo-600 font-bold text-sm mt-1">{formatRupiah(product.price)}</p>
                  <p className={`text-xs mt-1 ${product.stock <= 5 ? 'text-rose-600' : 'text-slate-500'}`}>
                    Stok: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="lg:w-96 flex flex-col">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="shopping-cart" size={20} className="text-indigo-500" />
                Keranjang
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-sm text-rose-600 hover:text-rose-700">
                  Kosongkan
                </button>
              )}
            </div>
            
            {/* Customer */}
            <button
              onClick={() => setShowCustomerPicker(!showCustomerPicker)}
              className="w-full p-2 bg-slate-50 rounded-lg text-left hover:bg-slate-100 transition-colors"
            >
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <Icon name="users" size={16} className="text-indigo-500" />
                  <span className="text-sm font-medium text-slate-800">{selectedCustomer.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon name="users" size={16} />
                  <span className="text-sm">Pilih Customer (opsional)</span>
                </div>
              )}
            </button>

            {showCustomerPicker && (
              <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg max-h-40 overflow-y-auto">
                {customers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust)
                      setShowCustomerPicker(false)
                    }}
                    className="w-full text-left p-2 hover:bg-indigo-100 rounded text-sm"
                  >
                    {cust.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="shopping-cart" size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Keranjang kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{formatRupiah(item.product.price)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-rose-500 hover:text-rose-600">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => updateCartQty(item.product.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center bg-white border border-slate-200 rounded py-1 text-sm"
                    />
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      className="w-7 h-7 bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                      +
                    </button>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-indigo-600 text-sm">{formatRupiah(item.product.price * item.qty)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Held Carts */}
          {heldCarts.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700 mb-2">Keranjang Ditahan ({heldCarts.length})</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {heldCarts.map(held => (
                  <div key={held.id} className="flex items-center gap-2 text-xs">
                    <button onClick={() => recallCart(held.id)} className="flex-1 text-left bg-white p-2 rounded hover:bg-amber-100">
                      {held.customer?.name || 'Customer'} - {held.items.length} items
                    </button>
                    <button onClick={() => deleteHeldCart(held.id)} className="text-rose-500 p-1">
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Footer */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Diskon:</label>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-right"
              />
              <span className="text-sm text-slate-600">%</span>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span className="text-indigo-600">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdCart}
                disabled={cart.length === 0}
                className="py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Tahan
              </button>
              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Bayar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Checkout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: 'dollar' },
                    { id: 'card', label: 'Kartu', icon: 'credit-card' },
                    { id: 'qris', label: 'QRIS', icon: 'qrcode' },
                    { id: 'ewallet', label: 'E-Wallet', icon: 'wallet' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon name={method.icon as any} size={24} className="mx-auto mb-1" />
                      <p className="text-sm font-medium">{method.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-indigo-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCheckout}
                  className="py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
