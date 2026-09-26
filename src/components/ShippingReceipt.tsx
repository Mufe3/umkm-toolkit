import { useState, useEffect } from 'react'
import { getFromStorage, saveToStorage, formatRupiah, formatDate, generateId } from '../utils/storage'
import { Icon } from './Icon'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Barcode from 'react-barcode'
import QRCode from 'qrcode'

interface ShippingReceipt {
  id: string
  resiNumber: string
  // Sender info
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCity: string
  // Receiver info
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCity: string
  receiverPostalCode: string
  // Package info
  items: Array<{ name: string; qty: number; weight: number }>
  totalWeight: number
  courier: string
  service: string
  shippingCost: number
  insurance: number
  totalCost: number
  // Additional
  notes: string
  date: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered'
}

interface SavedAddress {
  id: string
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
  isDefault: boolean
}

export default function ShippingReceipt() {
  const [receipts, setReceipts] = useState<ShippingReceipt[]>([])
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<ShippingReceipt | null>(null)
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Form state
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
  const [senderCity, setSenderCity] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [receiverCity, setReceiverCity] = useState('')
  const [receiverPostalCode, setReceiverPostalCode] = useState('')
  const [items, setItems] = useState<Array<{ name: string; qty: number; weight: number }>>([{ name: '', qty: 1, weight: 1 }])
  const [courier, setCourier] = useState('JNE')
  const [service, setService] = useState('Regular')
  const [shippingCost, setShippingCost] = useState(0)
  const [insurance, setInsurance] = useState(0)
  const [notes, setNotes] = useState('')

  // Address form state
  const [addrName, setAddrName] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [addrAddress, setAddrAddress] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrPostalCode, setAddrPostalCode] = useState('')
  const [addrIsDefault, setAddrIsDefault] = useState(false)

  useEffect(() => {
    setReceipts(getFromStorage<ShippingReceipt[]>('umkm_shipping_receipts', []))
    setSavedAddresses(getFromStorage<SavedAddress[]>('umkm_saved_addresses', []))
  }, [])

  // Generate QR Code when viewing receipt
  useEffect(() => {
    if (viewReceipt) {
      const qrData = JSON.stringify({
        resi: viewReceipt.resiNumber,
        courier: viewReceipt.courier,
        receiver: viewReceipt.receiverName,
        city: viewReceipt.receiverCity,
        status: viewReceipt.status,
      })
      QRCode.toDataURL(qrData, {
        width: 120,
        margin: 0,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(setQrCodeUrl)
    }
  }, [viewReceipt])

  const totalWeight = items.reduce((sum, item) => sum + (item.qty * item.weight), 0)
  const totalCost = shippingCost + insurance

  const handleSubmit = () => {
    if (!senderName || !receiverName || !receiverAddress) {
      alert('Lengkapi data pengirim dan penerima!')
      return
    }

    const receipt: ShippingReceipt = {
      id: generateId(),
      resiNumber: `${courier.toUpperCase()}${Date.now().toString().slice(-10)}`,
      senderName, senderPhone, senderAddress, senderCity,
      receiverName, receiverPhone, receiverAddress, receiverCity, receiverPostalCode,
      items: items.filter(i => i.name),
      totalWeight, courier, service, shippingCost, insurance, totalCost,
      notes, date: new Date().toISOString(),
      status: 'pending',
    }

    const updated = [receipt, ...receipts]
    setReceipts(updated)
    saveToStorage('umkm_shipping_receipts', updated)
    resetForm()
  }

  const resetForm = () => {
    setSenderName(''); setSenderPhone(''); setSenderAddress(''); setSenderCity('')
    setReceiverName(''); setReceiverPhone(''); setReceiverAddress(''); setReceiverCity(''); setReceiverPostalCode('')
    setItems([{ name: '', qty: 1, weight: 1 }])
    setCourier('JNE'); setService('Regular'); setShippingCost(0); setInsurance(0); setNotes('')
    setShowForm(false)
  }

  const deleteReceipt = (id: string) => {
    if (confirm('Hapus resi ini?')) {
      const updated = receipts.filter(r => r.id !== id)
      setReceipts(updated)
      saveToStorage('umkm_shipping_receipts', updated)
    }
  }

  const updateStatus = (id: string, status: ShippingReceipt['status']) => {
    const updated = receipts.map(r => r.id === id ? { ...r, status } : r)
    setReceipts(updated)
    saveToStorage('umkm_shipping_receipts', updated)
    if (viewReceipt?.id === id) setViewReceipt({ ...viewReceipt, status })
  }

  const handleExportPDF = async () => {
    const element = document.getElementById('shipping-receipt-preview')
    if (!element) return
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    // A6 size: 105mm x 148mm, custom: 100mm x 150mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, 100, 150)
    pdf.save(`${viewReceipt?.resiNumber || 'resi'}.pdf`)
  }

  // Address Book Functions
  const handleSaveAddress = () => {
    if (!addrName || !addrAddress) {
      alert('Lengkapi nama dan alamat!')
      return
    }

    if (editingAddress) {
      const updated = savedAddresses.map(a => 
        a.id === editingAddress.id 
          ? { ...a, name: addrName, phone: addrPhone, address: addrAddress, city: addrCity, postalCode: addrPostalCode, isDefault: addrIsDefault }
          : a
      )
      setSavedAddresses(updated)
      saveToStorage('umkm_saved_addresses', updated)
    } else {
      const newAddress: SavedAddress = {
        id: generateId(),
        name: addrName,
        phone: addrPhone,
        address: addrAddress,
        city: addrCity,
        postalCode: addrPostalCode,
        isDefault: addrIsDefault,
      }
      const updated = [newAddress, ...savedAddresses]
      setSavedAddresses(updated)
      saveToStorage('umkm_saved_addresses', updated)
    }

    resetAddressForm()
  }

  const resetAddressForm = () => {
    setAddrName(''); setAddrPhone(''); setAddrAddress(''); setAddrCity(''); setAddrPostalCode(''); setAddrIsDefault(false)
    setShowAddressForm(false)
    setEditingAddress(null)
  }

  const startEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr)
    setAddrName(addr.name)
    setAddrPhone(addr.phone)
    setAddrAddress(addr.address)
    setAddrCity(addr.city)
    setAddrPostalCode(addr.postalCode)
    setAddrIsDefault(addr.isDefault)
    setShowAddressForm(true)
  }

  const deleteAddress = (id: string) => {
    if (confirm('Hapus alamat ini?')) {
      const updated = savedAddresses.filter(a => a.id !== id)
      setSavedAddresses(updated)
      saveToStorage('umkm_saved_addresses', updated)
    }
  }

  const selectAddress = (addr: SavedAddress) => {
    setReceiverName(addr.name)
    setReceiverPhone(addr.phone)
    setReceiverAddress(addr.address)
    setReceiverCity(addr.city)
    setReceiverPostalCode(addr.postalCode)
    setShowAddressBook(false)
  }

  const setDefaultAddress = (id: string) => {
    const updated = savedAddresses.map(a => ({ ...a, isDefault: a.id === id }))
    setSavedAddresses(updated)
    saveToStorage('umkm_saved_addresses', updated)
  }

  const statusColors = {
    pending: 'bg-white text-black border-black',
    picked_up: 'bg-white text-black border-black',
    in_transit: 'bg-white text-black border-black',
    delivered: 'bg-white text-black border-black',
  }

  const statusLabels = {
    pending: 'Menunggu Pickup',
    picked_up: 'Sudah Diambil',
    in_transit: 'Dalam Pengiriman',
    delivered: 'Terkirim',
  }

  // Receipt Preview
  if (viewReceipt) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex gap-3">
          <button onClick={() => setViewReceipt(null)}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
            <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
          </button>
          <button onClick={handleExportPDF}
            className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2">
            <Icon name="download" size={16} /> Export PDF
          </button>
        </div>

        <div id="shipping-receipt-preview" className="bg-white rounded-lg p-4 border-2 border-black" style={{ width: '100mm', minHeight: '150mm' }}>
          {/* Header - Kompak */}
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-black">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
                {viewReceipt.courier.charAt(0)}
              </div>
              <div>
                <h1 className="text-sm font-bold text-black">{viewReceipt.courier}</h1>
                <p className="text-xs text-black">{viewReceipt.service}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-black">{formatDate(viewReceipt.date)}</p>
            </div>
          </div>

          {/* Barcode & QR Code - Kompak */}
          <div className="mb-3 pb-3 border-b border-black">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-xs font-bold text-black mb-1">{viewReceipt.resiNumber}</p>
                <div className="bg-white">
                  <Barcode 
                    value={viewReceipt.resiNumber} 
                    width={1.2}
                    height={35}
                    fontSize={10}
                    margin={0}
                  />
                </div>
              </div>
              {qrCodeUrl && (
                <div>
                  <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 border border-black" />
                </div>
              )}
            </div>
          </div>

          {/* Info Penerima - Kompak */}
          <div className="mb-3 pb-3 border-b border-black">
            <p className="text-xs font-bold text-black mb-1">PENERIMA:</p>
            <p className="text-sm font-bold text-black">{viewReceipt.receiverName}</p>
            <p className="text-xs text-black">{viewReceipt.receiverPhone}</p>
            <p className="text-xs text-black">{viewReceipt.receiverAddress}</p>
            {viewReceipt.receiverCity && <p className="text-xs text-black">{viewReceipt.receiverCity} {viewReceipt.receiverPostalCode && `- ${viewReceipt.receiverPostalCode}`}</p>}
          </div>

          {/* Info Pengirim - Kompak */}
          <div className="mb-3 pb-3 border-b border-black">
            <p className="text-xs font-bold text-black mb-1">PENGIRIM:</p>
            <p className="text-xs text-black">{viewReceipt.senderName}</p>
            <p className="text-xs text-black">{viewReceipt.senderPhone}</p>
            <p className="text-xs text-black">{viewReceipt.senderAddress}</p>
            {viewReceipt.senderCity && <p className="text-xs text-black">{viewReceipt.senderCity}</p>}
          </div>

          {/* Detail Paket - Sangat Kompak */}
          <div className="mb-3 pb-3 border-b border-black">
            <p className="text-xs font-bold text-black mb-1">PAKET: {viewReceipt.totalWeight.toFixed(2)} kg | {viewReceipt.items.length} item</p>
            <div className="text-xs text-black space-y-0.5">
              {viewReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name} x{item.qty}</span>
                  <span>{(item.qty * item.weight).toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Biaya - Kompak */}
          <div className="mb-3 pb-3 border-b border-black">
            <div className="text-xs text-black space-y-0.5">
              <div className="flex justify-between">
                <span>Ongkir:</span>
                <span>{formatRupiah(viewReceipt.shippingCost)}</span>
              </div>
              {viewReceipt.insurance > 0 && (
                <div className="flex justify-between">
                  <span>Asuransi:</span>
                  <span>{formatRupiah(viewReceipt.insurance)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-black mt-1">
                <span>TOTAL:</span>
                <span>{formatRupiah(viewReceipt.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Catatan - Jika ada */}
          {viewReceipt.notes && (
            <div className="mb-3 pb-3 border-b border-black">
              <p className="text-xs font-bold text-black mb-1">CATATAN:</p>
              <p className="text-xs text-black">{viewReceipt.notes}</p>
            </div>
          )}

          {/* Status - Kompak */}
          <div className="text-center">
            <p className="text-xs font-bold text-black border border-black inline-block px-3 py-1">
              {statusLabels[viewReceipt.status]}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Address Book View
  if (showAddressBook) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Buku Alamat</h2>
            <p className="text-slate-600 mt-1">Kelola alamat penerima yang sering digunakan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddressBook(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
              <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
            </button>
            <button onClick={() => { resetAddressForm(); setShowAddressForm(true) }}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
              <Icon name="plus" size={18} /> Tambah Alamat
            </button>
          </div>
        </div>

        {/* Address Form */}
        {showAddressForm && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nama Penerima *</label>
                <input type="text" value={addrName} onChange={e => setAddrName(e.target.value)}
                  placeholder="Nama penerima"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Telepon</label>
                <input type="tel" value={addrPhone} onChange={e => setAddrPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 mb-1 block">Alamat *</label>
                <textarea value={addrAddress} onChange={e => setAddrAddress(e.target.value)}
                  placeholder="Alamat lengkap" rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kota</label>
                <input type="text" value={addrCity} onChange={e => setAddrCity(e.target.value)}
                  placeholder="Kota"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kode Pos</label>
                <input type="text" value={addrPostalCode} onChange={e => setAddrPostalCode(e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={addrIsDefault} onChange={e => setAddrIsDefault(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded" />
              <label htmlFor="isDefault" className="text-sm text-slate-700">Jadikan alamat default</label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveAddress}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors">
                Simpan
              </button>
              <button onClick={resetAddressForm}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Address List */}
        <div className="space-y-3">
          {savedAddresses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
              <div className="mb-4"><Icon name="location" size={48} className="text-slate-300 mx-auto" /></div>
              <p className="text-slate-600">Belum ada alamat tersimpan. Tambah alamat pertamamu!</p>
            </div>
          ) : (
            savedAddresses.map(addr => (
              <div key={addr.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-slate-900">{addr.name}</h4>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{addr.phone}</p>
                    <p className="text-sm text-slate-600">{addr.address}</p>
                    {addr.city && <p className="text-sm text-slate-600">{addr.city}</p>}
                    {addr.postalCode && <p className="text-sm text-slate-600">Kode Pos: {addr.postalCode}</p>}
                  </div>
                  <div className="flex gap-2">
                    {!addr.isDefault && (
                      <button onClick={() => setDefaultAddress(addr.id)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-100 transition-colors">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => startEditAddress(addr)}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => deleteAddress(addr.id)}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resi Pengiriman</h2>
          <p className="text-slate-600 mt-1">Buat resi pengiriman dengan barcode & QR code</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddressBook(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Icon name="location" size={18} /> Buku Alamat
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
            <Icon name={showForm ? 'close' : 'plus'} size={18} />
            {showForm ? 'Batal' : 'Buat Resi'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Buat Resi Pengiriman Baru</h3>

          {/* Sender Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Icon name="arrow-up" size={16} className="text-indigo-500" /> Info Pengirim
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
                <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                  placeholder="Nama pengirim"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Telepon</label>
                <input type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 mb-1 block">Alamat</label>
                <textarea value={senderAddress} onChange={e => setSenderAddress(e.target.value)}
                  placeholder="Alamat lengkap" rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kota</label>
                <input type="text" value={senderCity} onChange={e => setSenderCity(e.target.value)}
                  placeholder="Kota pengirim"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
            </div>
          </div>

          {/* Receiver Info */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Icon name="arrow-down" size={16} className="text-emerald-500" /> Info Penerima
              </h4>
              {savedAddresses.length > 0 && (
                <button onClick={() => {
                  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0]
                  if (defaultAddr) selectAddress(defaultAddr)
                }}
                  className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                  <Icon name="location" size={14} /> Pilih dari Buku Alamat
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nama *</label>
                <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)}
                  placeholder="Nama penerima"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Telepon</label>
                <input type="tel" value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 mb-1 block">Alamat *</label>
                <textarea value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)}
                  placeholder="Alamat lengkap" rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kota</label>
                <input type="text" value={receiverCity} onChange={e => setReceiverCity(e.target.value)}
                  placeholder="Kota penerima"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kode Pos</label>
                <input type="text" value={receiverPostalCode} onChange={e => setReceiverPostalCode(e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
            </div>
          </div>

          {/* Package Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Icon name="package" size={16} className="text-violet-500" /> Isi Paket
              </h4>
              <button onClick={() => setItems([...items, { name: '', qty: 1, weight: 1 }])}
                className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n) }}
                    placeholder="Nama barang" className="col-span-5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.qty} onChange={e => { const n = [...items]; n[i].qty = parseInt(e.target.value) || 0; setItems(n) }}
                    placeholder="Qty" min="1" className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.weight} onChange={e => { const n = [...items]; n[i].weight = parseFloat(e.target.value) || 0; setItems(n) }}
                    placeholder="Berat (kg)" step="0.1" className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-400 text-xl">×</button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 mt-2">Total Berat: <span className="font-semibold">{totalWeight.toFixed(2)} kg</span></p>
          </div>

          {/* Shipping Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Icon name="truck" size={16} className="text-amber-500" /> Info Pengiriman
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Kurir</label>
                <select value={courier} onChange={e => setCourier(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                  <option>JNE</option>
                  <option>J&T</option>
                  <option>SiCepat</option>
                  <option>Anteraja</option>
                  <option>Ninja Express</option>
                  <option>POS Indonesia</option>
                  <option>GoSend</option>
                  <option>GrabExpress</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Layanan</label>
                <select value={service} onChange={e => setService(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                  <option>Regular</option>
                  <option>Yes</option>
                  <option>Same Day</option>
                  <option>Instant</option>
                  <option>Economy</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Ongkos Kirim (Rp)</label>
                <input type="number" value={shippingCost || ''} onChange={e => setShippingCost(parseInt(e.target.value) || 0)}
                  placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Asuransi (Rp)</label>
                <input type="number" value={insurance || ''} onChange={e => setInsurance(parseInt(e.target.value) || 0)}
                  placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800" />
              </div>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Biaya:</span>
                <span className="text-indigo-600">{formatRupiah(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan..." rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-800" />
          </div>

          <button onClick={handleSubmit}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Simpan Resi
          </button>
        </div>
      )}

      {/* Receipt List */}
      <div className="space-y-3">
        {receipts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
            <div className="mb-4"><Icon name="truck" size={48} className="text-slate-300 mx-auto" /></div>
            <p className="text-slate-600">Belum ada resi pengiriman. Buat resi pertamamu!</p>
          </div>
        ) : (
          receipts.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-indigo-600">{r.resiNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[r.status]}`}>
                      {statusLabels[r.status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">{r.senderName}</span> → <span className="font-semibold">{r.receiverName}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{r.courier} • {r.service} • {formatDate(r.date)}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatRupiah(r.totalCost)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewReceipt(r)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1">
                  <Icon name="eye" size={14} /> Lihat
                </button>
                {r.status === 'pending' && (
                  <button onClick={() => updateStatus(r.id, 'picked_up')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center gap-1">
                    <Icon name="check" size={14} /> Pickup
                  </button>
                )}
                {r.status === 'picked_up' && (
                  <button onClick={() => updateStatus(r.id, 'in_transit')}
                    className="px-3 py-1.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-lg text-sm hover:bg-violet-100 transition-colors flex items-center gap-1">
                    <Icon name="truck" size={14} /> Kirim
                  </button>
                )}
                {r.status === 'in_transit' && (
                  <button onClick={() => updateStatus(r.id, 'delivered')}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-1">
                    <Icon name="check-circle" size={14} /> Selesai
                  </button>
                )}
                <button onClick={() => deleteReceipt(r.id)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm hover:bg-rose-100 transition-colors flex items-center gap-1 ml-auto">
                  <Icon name="trash" size={14} /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
