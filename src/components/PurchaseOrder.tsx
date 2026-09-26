import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'

interface POItem {
  productName: string
  qty: number
  price: number
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  supplierId?: string
  items: POItem[]
  total: number
  date: string
  expectedDate: string
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  notes: string
}

export default function PurchaseOrder() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([])
  const [showForm, setShowForm] = useState(false)
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'ordered' | 'received'>('all')

  // Form state
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState<POItem[]>([{ productName: '', qty: 1, price: 0 }])
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setOrders(getFromStorage<PurchaseOrder[]>('umkm_purchase_orders', []))
    const savedSuppliers = getFromStorage<Array<{ id: string; name: string; phone: string }>>('umkm_suppliers', [])
    setSuppliers(savedSuppliers.map(s => ({ id: s.id, name: s.name })))
  }, [])

  const addItem = () => setItems([...items, { productName: '', qty: 1, price: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  const handleSubmit = () => {
    if (!supplier || items.some(i => !i.productName || i.price <= 0)) {
      alert('Lengkapi semua data PO!')
      return
    }

    const order: PurchaseOrder = {
      id: generateId(),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplier,
      items: items.filter(i => i.productName),
      total,
      date: new Date().toISOString(),
      expectedDate: expectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      notes,
    }

    const updated = [order, ...orders]
    setOrders(updated)
    saveToStorage('umkm_purchase_orders', updated)
    resetForm()
  }

  const resetForm = () => {
    setSupplier('')
    setItems([{ productName: '', qty: 1, price: 0 }])
    setExpectedDate('')
    setNotes('')
    setShowForm(false)
  }

  const updateStatus = (id: string, status: PurchaseOrder['status']) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o)
    setOrders(updated)
    saveToStorage('umkm_purchase_orders', updated)
    if (viewOrder?.id === id) setViewOrder({ ...viewOrder, status })
  }

  const deleteOrder = (id: string) => {
    if (confirm('Hapus PO ini?')) {
      const updated = orders.filter(o => o.id !== id)
      setOrders(updated)
      saveToStorage('umkm_purchase_orders', updated)
      setViewOrder(null)
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    ordered: 'bg-blue-500/20 text-blue-400',
    received: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }

  const statusLabels: Record<string, string> = {
    pending: '⏳ Pending',
    ordered: '📦 Dipesan',
    received: '✅ Diterima',
    cancelled: '❌ Dibatalkan',
  }

  // Stats
  const totalPO = orders.length
  const pendingPO = orders.filter(o => o.status === 'pending').length
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0)
  const receivedThisMonth = orders.filter(o => {
    const d = new Date(o.date)
    const now = new Date()
    return o.status === 'received' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Detail View
  if (viewOrder) {
    return (
      <div className="space-y-6">
        <button onClick={() => setViewOrder(null)} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
          ← Kembali
        </button>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{viewOrder.poNumber}</h2>
              <p className="text-gray-400">Supplier: {viewOrder.supplier}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors[viewOrder.status]}`}>
              {statusLabels[viewOrder.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Tanggal PO</p>
              <p className="font-bold">{formatDate(viewOrder.date)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Estimasi Tiba</p>
              <p className="font-bold">{formatDate(viewOrder.expectedDate)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Total Item</p>
              <p className="font-bold">{viewOrder.items.length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Total Nilai</p>
              <p className="font-bold text-purple-400">{formatRupiah(viewOrder.total)}</p>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400 text-sm">Produk</th>
                <th className="text-center py-2 text-gray-400 text-sm">Qty</th>
                <th className="text-right py-2 text-gray-400 text-sm">Harga</th>
                <th className="text-right py-2 text-gray-400 text-sm">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {viewOrder.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className="py-3">{item.productName}</td>
                  <td className="text-center py-3">{item.qty}</td>
                  <td className="text-right py-3">{formatRupiah(item.price)}</td>
                  <td className="text-right py-3 font-bold">{formatRupiah(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold">TOTAL</span>
            <span className="text-2xl font-bold text-purple-400">{formatRupiah(viewOrder.total)}</span>
          </div>

          {viewOrder.notes && (
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Catatan:</p>
              <p>{viewOrder.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {viewOrder.status === 'pending' && (
              <>
                <button onClick={() => updateStatus(viewOrder.id, 'ordered')}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30">
                  📦 Tandai Dipesan
                </button>
                <button onClick={() => updateStatus(viewOrder.id, 'cancelled')}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30">
                  ❌ Batalkan
                </button>
              </>
            )}
            {viewOrder.status === 'ordered' && (
              <button onClick={() => updateStatus(viewOrder.id, 'received')}
                className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30">
                ✅ Tandai Diterima
              </button>
            )}
            <button onClick={() => deleteOrder(viewOrder.id)}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 ml-auto">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">📋 Purchase Order</h2>
          <p className="text-gray-400 mt-1">Kelola pemesanan ke supplier</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/30">
          {showForm ? 'Batal' : '+ Buat PO'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total PO</p>
          <p className="text-2xl font-bold">{totalPO}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pendingPO}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Nilai</p>
          <p className="text-2xl font-bold text-purple-400">{formatRupiah(totalValue)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Diterima Bulan Ini</p>
          <p className="text-2xl font-bold text-green-400">{receivedThisMonth}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex bg-gray-900 rounded-lg border border-gray-800 overflow-hidden w-fit">
        {(['all', 'pending', 'ordered', 'received'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {f === 'all' ? 'Semua' : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h3 className="text-xl font-bold">📋 Buat Purchase Order Baru</h3>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Supplier *</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)}
              placeholder="Nama supplier" list="supplier-list"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
            <datalist id="supplier-list">
              {suppliers.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Estimasi Tanggal Tiba</label>
            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-gray-400">Item Pesanan *</label>
              <button onClick={addItem} className="text-sm text-purple-400 hover:text-purple-300">+ Tambah Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                    placeholder="Nama produk" className="col-span-5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
                  <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Qty" min="1" className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
                  <input type="number" value={item.price || ''} onChange={e => updateItem(i, 'price', parseInt(e.target.value) || 0)}
                    placeholder="Harga" className="col-span-4 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="col-span-1 text-red-400 text-xl">×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <span className="text-gray-400">Total: </span>
              <span className="text-2xl font-bold text-purple-400">{formatRupiah(total)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan..."
              rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/30">
            💾 Simpan PO
          </button>
        </div>
      )}

      {/* Order List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400">Belum ada purchase order</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} onClick={() => setViewOrder(order)}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">{order.poNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-gray-400">Supplier: {order.supplier}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.date)} • {order.items.length} item</p>
                </div>
                <p className="text-xl font-bold text-purple-400">{formatRupiah(order.total)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
