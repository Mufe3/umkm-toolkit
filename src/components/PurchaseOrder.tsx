import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'

interface POItem {
  productName: string
  qty: number
  price: number
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  items: POItem[]
  total: number
  date: string
  expectedDate: string
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  notes: string
}

export default function PurchaseOrder() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'ordered' | 'received'>('all')

  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState<POItem[]>([{ productName: '', qty: 1, price: 0 }])
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setOrders(getFromStorage<PurchaseOrder[]>('umkm_purchase_orders', []))
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

  const totalPO = orders.length
  const pendingPO = orders.filter(o => o.status === 'pending').length
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0)

  if (viewOrder) {
    return (
      <div className="space-y-4">
        <button onClick={() => setViewOrder(null)} 
          className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
          <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
        </button>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{viewOrder.poNumber}</h2>
              <p className="text-slate-500">Supplier: {viewOrder.supplier}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              viewOrder.status === 'pending' ? 'bg-amber-50 text-amber-600' :
              viewOrder.status === 'ordered' ? 'bg-sky-50 text-sky-600' :
              viewOrder.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
              'bg-rose-50 text-rose-600'
            }`}>
              {viewOrder.status === 'pending' ? 'Pending' :
               viewOrder.status === 'ordered' ? 'Dipesan' :
               viewOrder.status === 'received' ? 'Diterima' : 'Dibatalkan'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Tanggal PO</p>
              <p className="font-semibold text-slate-800">{formatDate(viewOrder.date)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Estimasi Tiba</p>
              <p className="font-semibold text-slate-800">{formatDate(viewOrder.expectedDate)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Total Item</p>
              <p className="font-semibold text-slate-800">{viewOrder.items.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Total Nilai</p>
              <p className="font-semibold text-indigo-600">{formatRupiah(viewOrder.total)}</p>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-500 text-xs uppercase">Produk</th>
                <th className="text-center py-2 text-slate-500 text-xs uppercase">Qty</th>
                <th className="text-right py-2 text-slate-500 text-xs uppercase">Harga</th>
                <th className="text-right py-2 text-slate-500 text-xs uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {viewOrder.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-700">{item.productName}</td>
                  <td className="text-center py-3 text-slate-600">{item.qty}</td>
                  <td className="text-right py-3 text-slate-600">{formatRupiah(item.price)}</td>
                  <td className="text-right py-3 font-semibold text-slate-800">{formatRupiah(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-slate-800">TOTAL</span>
            <span className="text-2xl font-bold text-indigo-600">{formatRupiah(viewOrder.total)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {viewOrder.status === 'pending' && (
              <>
                <button onClick={() => updateStatus(viewOrder.id, 'ordered')}
                  className="px-4 py-2 bg-sky-50 text-sky-600 border border-sky-100 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium flex items-center gap-1">
                  <Icon name="check" size={14} /> Tandai Dipesan
                </button>
                <button onClick={() => updateStatus(viewOrder.id, 'cancelled')}
                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium flex items-center gap-1">
                  <Icon name="x-circle" size={14} /> Batalkan
                </button>
              </>
            )}
            {viewOrder.status === 'ordered' && (
              <button onClick={() => updateStatus(viewOrder.id, 'received')}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1">
                <Icon name="check" size={14} /> Tandai Diterima
              </button>
            )}
            <button onClick={() => deleteOrder(viewOrder.id)}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium flex items-center gap-1 ml-auto">
              <Icon name="trash" size={14} /> Hapus
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
          <h2 className="text-2xl font-bold text-slate-800">Purchase Order</h2>
          <p className="text-slate-500 mt-1">Kelola pemesanan ke supplier</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Icon name={showForm ? 'close' : 'plus'} size={18} />
          {showForm ? 'Batal' : 'Buat PO'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Icon name="purchase" size={16} className="text-indigo-500" />
            </div>
            <p className="text-xs text-slate-500">Total PO</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalPO}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Icon name="clock" size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pendingPO}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Icon name="dollar" size={16} className="text-violet-500" />
            </div>
            <p className="text-xs text-slate-500">Total Nilai</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalValue)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden w-fit">
        {(['all', 'pending', 'ordered', 'received'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm transition-colors ${filter === f ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
            {f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : f === 'ordered' ? 'Dipesan' : 'Diterima'}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800">Buat Purchase Order Baru</h3>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Supplier *</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)}
              placeholder="Nama supplier"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Estimasi Tanggal Tiba</label>
            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-800" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm text-slate-600">Item Pesanan *</label>
              <button onClick={addItem} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                    placeholder="Nama produk"
                    className="col-span-5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800" />
                  <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 0)}
                    placeholder="Qty" min="1"
                    className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800" />
                  <input type="number" value={item.price || ''} onChange={e => updateItem(i, 'price', parseInt(e.target.value) || 0)}
                    placeholder="Harga"
                    className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm text-slate-800" />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="col-span-1 text-rose-400 hover:text-rose-500 text-xl">×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <span className="text-slate-500">Total: </span>
              <span className="text-2xl font-bold text-indigo-600">{formatRupiah(total)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan..."
              rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan PO
          </button>
        </div>
      )}

      {/* Order List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-sm text-center">
            <div className="mb-4">
              <Icon name="purchase" size={48} className="text-slate-300 mx-auto" />
            </div>
            <p className="text-slate-500">Belum ada purchase order</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} onClick={() => setViewOrder(order)}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:border-slate-200 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg text-slate-800">{order.poNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      order.status === 'ordered' ? 'bg-sky-50 text-sky-600' :
                      order.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {order.status === 'pending' ? 'Pending' :
                       order.status === 'ordered' ? 'Dipesan' :
                       order.status === 'received' ? 'Diterima' : 'Dibatalkan'}
                    </span>
                  </div>
                  <p className="text-slate-500">Supplier: {order.supplier}</p>
                  <p className="text-sm text-slate-400">{formatDate(order.date)} • {order.items.length} item</p>
                </div>
                <p className="text-xl font-bold text-indigo-600">{formatRupiah(order.total)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
