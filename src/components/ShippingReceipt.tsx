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
  items: Array<{ name: string; qty: number; weight: number; price: number }>
  totalWeight: number
  courier: string
  service: string
  shippingCost: number
  insurance: number
  totalCost: number
  paymentMethod: string
  // Custom branding
  customLogo: string
  customBrandName: string
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

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

interface SenderProfile {
  id: string
  name: string
  phone: string
  address: string
  city: string
  logo: string
  brandName: string
  isDefault: boolean
}

export default function ShippingReceipt() {
  const [receipts, setReceipts] = useState<ShippingReceipt[]>([])
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<ShippingReceipt | null>(null)
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showSenderProfileManager, setShowSenderProfileManager] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [editingSender, setEditingSender] = useState<SenderProfile | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Form state
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [senderAddress, setSenderAddress] = useState('')
  const [senderCity, setSenderCity] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverCustomerId, setReceiverCustomerId] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [receiverCity, setReceiverCity] = useState('')
  const [receiverPostalCode, setReceiverPostalCode] = useState('')
  const [items, setItems] = useState<Array<{ name: string; qty: number; weight: number; price: number }>>([{ name: '', qty: 1, weight: 1, price: 0 }])
  const [courier, setCourier] = useState('JNE')
  const [service, setService] = useState('Regular')
  const [shippingCost, setShippingCost] = useState(0)
  const [insurance, setInsurance] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [customLogo, setCustomLogo] = useState('')
  const [customBrandName, setCustomBrandName] = useState('')
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
    setCustomers(getFromStorage<Customer[]>('umkm_customers', []))
    setSenderProfiles(getFromStorage<SenderProfile[]>('umkm_sender_profiles', []))
    
    // Check for quick action from customer profile
    const quickAction = getFromStorage<any>('umkm_quick_action', null)
    if (quickAction && quickAction.type === 'shipping') {
      setReceiverName(quickAction.customerName || '')
      setReceiverCustomerId(quickAction.customerId || '')
      setReceiverPhone(quickAction.customerPhone || '')
      setReceiverAddress(quickAction.customerAddress || '')
      setShowForm(true)
      localStorage.removeItem('umkm_quick_action')
      return
    }
    
    // Check if there's data from receipt
    const fromReceipt = getFromStorage<any>('umkm_shipping_from_receipt', null)
    if (fromReceipt) {
      setReceiverName(fromReceipt.customerName || '')
      setItems(fromReceipt.items || [{ name: '', qty: 1, weight: 1, price: 0 }])
      setShowForm(true)
      localStorage.removeItem('umkm_shipping_from_receipt')
      return
    }
    
    // Check if there's data from invoice
    const fromInvoice = getFromStorage<any>('umkm_shipping_from_invoice', null)
    if (fromInvoice) {
      setReceiverName(fromInvoice.customerName || '')
      setReceiverPhone(fromInvoice.customerPhone || '')
      setItems(fromInvoice.items || [{ name: '', qty: 1, weight: 1, price: 0 }])
      setShowForm(true)
      localStorage.removeItem('umkm_shipping_from_invoice')
    }
  }, [])

  // Auto-fill sender from default profile when form opens
  useEffect(() => {
    if (showForm && senderProfiles.length > 0) {
      const defaultSender = senderProfiles.find(s => s.isDefault) || senderProfiles[0]
      if (defaultSender && !senderName) {
        setSenderName(defaultSender.name)
        setSenderPhone(defaultSender.phone)
        setSenderAddress(defaultSender.address)
        setSenderCity(defaultSender.city)
        setCustomLogo(defaultSender.logo)
        setCustomBrandName(defaultSender.brandName)
      }
    }
  }, [showForm, senderProfiles])

  const selectCustomerFromDB = (cust: Customer) => {
    setReceiverName(cust.name)
    setReceiverCustomerId(cust.id)
    setReceiverPhone(cust.phone)
    setReceiverAddress(cust.address)
    setShowCustomerPicker(false)
  }

  // Sender Profile Management
  const handleSaveSenderProfile = () => {
    if (!senderName || !senderAddress) {
      alert('Nama dan alamat pengirim wajib diisi!')
      return
    }

    const profile: SenderProfile = {
      id: editingSender?.id || generateId(),
      name: senderName,
      phone: senderPhone,
      address: senderAddress,
      city: senderCity,
      logo: customLogo,
      brandName: customBrandName,
      isDefault: senderProfiles.length === 0 || editingSender?.isDefault || false,
    }

    let updated: SenderProfile[]
    if (editingSender) {
      updated = senderProfiles.map(s => s.id === editingSender.id ? profile : s)
    } else {
      updated = [...senderProfiles, profile]
    }

    setSenderProfiles(updated)
    saveToStorage('umkm_sender_profiles', updated)
    setEditingSender(null)
    setShowSenderProfileManager(false)
    alert('Profil pengirim berhasil disimpan!')
  }

  const selectSenderProfile = (profile: SenderProfile) => {
    setSenderName(profile.name)
    setSenderPhone(profile.phone)
    setSenderAddress(profile.address)
    setSenderCity(profile.city)
    setCustomLogo(profile.logo)
    setCustomBrandName(profile.brandName)
  }

  const deleteSenderProfile = (id: string) => {
    if (confirm('Hapus profil pengirim ini?')) {
      const updated = senderProfiles.filter(s => s.id !== id)
      setSenderProfiles(updated)
      saveToStorage('umkm_sender_profiles', updated)
    }
  }

  const setDefaultSender = (id: string) => {
    const updated = senderProfiles.map(s => ({ ...s, isDefault: s.id === id }))
    setSenderProfiles(updated)
    saveToStorage('umkm_sender_profiles', updated)
  }

  // Generate QR Code when viewing receipt - Simplified to just resi number
  useEffect(() => {
    if (viewReceipt) {
      // Simple QR code with just the resi number for cleaner look
      QRCode.toDataURL(viewReceipt.resiNumber, {
        width: 120,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(setQrCodeUrl)
    }
  }, [viewReceipt])

  const totalWeight = items.reduce((sum, item) => sum + (item.qty * item.weight), 0)
  const totalItemsCost = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
  const totalCost = totalItemsCost + shippingCost + insurance

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
      paymentMethod,
      customLogo,
      customBrandName,
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
    setItems([{ name: '', qty: 1, weight: 1, price: 0 }])
    setCourier('JNE'); setService('Regular'); setShippingCost(0); setInsurance(0); setPaymentMethod('Tunai'); setCustomLogo(''); setCustomBrandName(''); setNotes('')
    setEditingSender(null)
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('shipping-receipt-preview')
    if (!element) return
    
    const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150]
    })
    pdf.addImage(imgData, 'PNG', 0, 0, 100, 150)
    pdf.save(`${viewReceipt?.resiNumber || 'resi'}.pdf`)
  }

  const handleShare = async () => {
    const element = document.getElementById('shipping-receipt-preview')
    if (!element) return
    
    try {
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        
        const file = new File([blob], `${viewReceipt?.resiNumber || 'resi'}.png`, { type: 'image/png' })
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Resi Pengiriman',
            text: `Resi #${viewReceipt?.resiNumber}`,
          })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${viewReceipt?.resiNumber || 'resi'}.png`
          a.click()
          URL.revokeObjectURL(url)
          alert('File downloaded! Buka di app printer untuk print.')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Share failed:', error)
      alert('Share tidak support di browser ini. Gunakan Download PDF.')
    }
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
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2 text-sm">
              <Icon name="print" size={16} /> Print
            </button>
            <button onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 text-sm">
              <Icon name="download" size={16} /> PDF
            </button>
            <button onClick={handleShare}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 text-sm">
              <Icon name="share" size={16} /> Share
            </button>
          </div>
        </div>

        <div id="shipping-receipt-preview" className="bg-white border-2 border-black" style={{ width: '100mm', minHeight: '150mm', padding: '4mm' }}>
          
          {/* ===== BAGIAN 1: HEADER ===== */}
          {/* ===== BAGIAN 1: HEADER - Logo Brand Kiri, QR Code Kanan ===== */}
          <div className="flex justify-between items-center mb-2">
            {/* Logo & Brand Name - KIRI */}
            <div className="flex items-center gap-2">
              {viewReceipt.customLogo ? (
                <img src={viewReceipt.customLogo} alt="Logo" className="w-16 h-16 object-contain" />
              ) : viewReceipt.customBrandName ? (
                <div className="w-16 h-16 bg-black rounded flex items-center justify-center text-white font-bold text-2xl">
                  {viewReceipt.customBrandName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-16 h-16 bg-black rounded flex items-center justify-center text-white font-bold text-2xl">
                  {viewReceipt.courier.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-base font-bold text-black leading-tight">
                  {viewReceipt.customBrandName || viewReceipt.courier}
                </p>
                <p className="text-xs text-black">{viewReceipt.courier} • {viewReceipt.service}</p>
              </div>
            </div>
            {/* QR Code - KANAN */}
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR" className="w-16 h-16 border border-black" />
            )}
          </div>

          {/* ===== BAGIAN 2: BARCODE & NO RESI (Full Width) ===== */}
          <div className="mb-3 pb-2 border-b-2 border-black px-2">
            <div className="flex justify-center items-center w-full">
              <Barcode 
                value={viewReceipt.resiNumber} 
                width={viewReceipt.resiNumber.length > 15 ? 1.5 : viewReceipt.resiNumber.length > 12 ? 2 : 2.5}
                height={40}
                fontSize={0}
                margin={0}
                displayValue={false}
              />
            </div>
            <p className="text-xs font-bold text-black mt-1 text-center tracking-wider">{viewReceipt.resiNumber}</p>
          </div>

          {/* ===== BAGIAN 3: INFO PENERIMA & PENGIRIM (Side by Side) ===== */}
          <div className="mb-2 pb-2 border-b border-black grid grid-cols-2 gap-2">
            {/* PENERIMA - KIRI */}
            <div className="border-r border-black pr-2">
              <p className="text-[10px] font-bold text-black mb-1 tracking-wider border-b border-black pb-0.5">PENERIMA:</p>
              <p className="text-xs font-bold text-black leading-tight mb-0.5">{viewReceipt.receiverName}</p>
              <p className="text-[10px] text-black leading-tight">{viewReceipt.receiverPhone}</p>
              <p className="text-[10px] text-black leading-tight">{viewReceipt.receiverAddress}</p>
              {viewReceipt.receiverCity && (
                <p className="text-[10px] text-black leading-tight font-semibold">
                  {viewReceipt.receiverCity} {viewReceipt.receiverPostalCode && `${viewReceipt.receiverPostalCode}`}
                </p>
              )}
            </div>
            {/* PENGIRIM - KANAN */}
            <div className="pl-2">
              <p className="text-[10px] font-bold text-black mb-1 tracking-wider border-b border-black pb-0.5">PENGIRIM:</p>
              <p className="text-[10px] text-black leading-tight font-semibold">{viewReceipt.senderName}</p>
              <p className="text-[10px] text-black leading-tight">{viewReceipt.senderPhone}</p>
              <p className="text-[10px] text-black leading-tight">{viewReceipt.senderAddress}</p>
              {viewReceipt.senderCity && <p className="text-[10px] text-black leading-tight">{viewReceipt.senderCity}</p>}
            </div>
          </div>

          {/* ===== BAGIAN 5: DETAIL PAKET ===== */}
          <div className="mb-2 pb-2 border-b border-black">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-black tracking-wider">ISI PAKET</p>
              <p className="text-[10px] font-bold text-black">{viewReceipt.totalWeight.toFixed(2)} kg</p>
            </div>
            <div className="text-[10px] text-black space-y-0.5">
              {viewReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="flex-1">{item.name}</span>
                  <span className="font-semibold">x{item.qty} ({item.weight}kg)</span>
                </div>
              ))}
            </div>
          </div>

          {/* ===== BAGIAN 6: BIAYA PENGIRIMAN ===== */}
          <div className="mb-2 pb-2 border-b border-black text-[10px] text-black">
            <div className="flex justify-between">
              <span>Ongkir ({viewReceipt.service}):</span>
              <span className="font-semibold">{formatRupiah(viewReceipt.shippingCost)}</span>
            </div>
            {viewReceipt.insurance > 0 && (
              <div className="flex justify-between">
                <span>Asuransi:</span>
                <span className="font-semibold">{formatRupiah(viewReceipt.insurance)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 mt-1 border-t border-black">
              <span>TOTAL BIAYA KIRIM:</span>
              <span>{formatRupiah(viewReceipt.shippingCost + viewReceipt.insurance)}</span>
            </div>
          </div>

          {/* ===== BAGIAN 7: CATATAN (JIKA ADA) ===== */}
          {viewReceipt.notes && (
            <div className="mb-2 pb-2 border-b border-black">
              <p className="text-[10px] font-bold text-black mb-0.5">CATATAN:</p>
              <p className="text-[10px] text-black italic">{viewReceipt.notes}</p>
            </div>
          )}

          {/* ===== BAGIAN 8: TANGGAL & STATUS ===== */}
          <div className="flex justify-between items-center pt-1">
            <p className="text-[10px] text-black">
              {formatDate(viewReceipt.date)}
            </p>
            <p className="text-[10px] font-bold text-black border border-black px-3 py-0.5 tracking-wider">
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

  // Sender Profile Manager View
  if (showSenderProfileManager) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Profil Pengirim</h2>
            <p className="text-slate-600 mt-1">Kelola data pengirim yang sering digunakan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowSenderProfileManager(false); setEditingSender(null) }}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-medium flex items-center gap-2">
              <Icon name="arrow-down" size={16} className="rotate-90" /> Kembali
            </button>
            <button onClick={() => {
              setEditingSender(null)
              setSenderName('')
              setSenderPhone('')
              setSenderAddress('')
              setSenderCity('')
              setCustomLogo('')
              setCustomBrandName('')
              setShowForm(true)
              setShowSenderProfileManager(false)
            }}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
              <Icon name="plus" size={18} /> Tambah Profil
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
          <div className="flex items-start gap-3">
            <Icon name="info" size={20} className="text-indigo-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-900 mb-1">Tips:</p>
              <p className="text-sm text-indigo-800">
                Simpan profil pengirim untuk toko/brand Anda. Data akan otomatis terisi saat membuat resi baru, sehingga tidak perlu input ulang.
              </p>
            </div>
          </div>
        </div>

        {/* Sender Profiles List */}
        <div className="space-y-3">
          {senderProfiles.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center">
              <div className="mb-4">
                <Icon name="users" size={48} className="text-slate-300 mx-auto" />
              </div>
              <p className="text-slate-600 mb-4">Belum ada profil pengirim tersimpan</p>
              <button onClick={() => {
                setEditingSender(null)
                setSenderName('')
                setSenderPhone('')
                setSenderAddress('')
                setSenderCity('')
                setCustomLogo('')
                setCustomBrandName('')
                setShowForm(true)
                setShowSenderProfileManager(false)
              }}
                className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors">
                Buat Profil Pertama
              </button>
            </div>
          ) : (
            senderProfiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    {profile.logo ? (
                      <img src={profile.logo} alt="Logo" className="w-16 h-16 object-contain border border-slate-200 rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                        <Icon name="users" size={32} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">{profile.brandName || profile.name}</h4>
                        {profile.isDefault && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{profile.name}</p>
                      <p className="text-sm text-slate-600 mb-1">{profile.phone}</p>
                      <p className="text-sm text-slate-600">{profile.address}</p>
                      {profile.city && <p className="text-sm text-slate-600">{profile.city}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!profile.isDefault && (
                      <button onClick={() => setDefaultSender(profile.id)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-100 transition-colors">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => {
                      setEditingSender(profile)
                      setSenderName(profile.name)
                      setSenderPhone(profile.phone)
                      setSenderAddress(profile.address)
                      setSenderCity(profile.city)
                      setCustomLogo(profile.logo)
                      setCustomBrandName(profile.brandName)
                      setShowForm(true)
                      setShowSenderProfileManager(false)
                    }}
                      className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors">
                      <Icon name="edit" size={14} />
                    </button>
                    <button onClick={() => deleteSenderProfile(profile.id)}
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
          <button onClick={() => setShowSenderProfileManager(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Icon name="users" size={18} /> Profil Pengirim
          </button>
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

          {/* Custom Brand & Logo */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Icon name="image" size={16} className="text-violet-500" /> Brand & Logo Custom (Opsional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Nama Brand/Toko</label>
                <input 
                  type="text"
                  value={customBrandName}
                  onChange={e => setCustomBrandName(e.target.value)}
                  placeholder="Contoh: Toko Maju Jaya"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Upload Logo (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setCustomLogo(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>
            </div>
            {(customLogo || customBrandName) && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {customLogo && (
                  <img src={customLogo} alt="Preview" className="w-12 h-12 object-contain" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{customBrandName || 'Brand Name'}</p>
                  <p className="text-xs text-slate-600">Preview: {courier} • {service}</p>
                </div>
                <button onClick={() => { setCustomLogo(''); setCustomBrandName('') }} className="text-xs text-rose-500 hover:text-rose-600">Hapus</button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Brand name dan logo akan ditampilkan di header resi. Jika tidak diisi, akan menggunakan nama ekspedisi default.</p>
          </div>

          {/* Sender Info */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Icon name="arrow-up" size={16} className="text-indigo-500" /> Info Pengirim
              </h4>
              <div className="flex gap-2">
                {senderProfiles.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      const defaultSender = senderProfiles.find(s => s.isDefault) || senderProfiles[0]
                      if (defaultSender) selectSenderProfile(defaultSender)
                    }}
                    className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                  >
                    <Icon name="users" size={14} /> Pilih Profil
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => {
                    // Save current sender as new profile
                    if (senderName && senderAddress) {
                      const newProfile: SenderProfile = {
                        id: generateId(),
                        name: senderName,
                        phone: senderPhone,
                        address: senderAddress,
                        city: senderCity,
                        logo: customLogo,
                        brandName: customBrandName,
                        isDefault: senderProfiles.length === 0,
                      }
                      const updated = [...senderProfiles, newProfile]
                      setSenderProfiles(updated)
                      saveToStorage('umkm_sender_profiles', updated)
                      alert('Profil pengirim berhasil disimpan!')
                    } else {
                      alert('Lengkapi nama dan alamat pengirim terlebih dahulu!')
                    }
                  }}
                  className="text-sm text-emerald-500 hover:text-emerald-600 font-medium flex items-center gap-1"
                >
                  <Icon name="check" size={14} /> Simpan sebagai Profil
                </button>
              </div>
            </div>

            {/* Sender Profile Picker */}
            {senderProfiles.length > 1 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-semibold text-indigo-700 mb-2">Pilih Profil Pengirim:</p>
                <div className="space-y-2">
                  {senderProfiles.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => selectSenderProfile(profile)}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <div className="flex items-center gap-3">
                        {profile.logo ? (
                          <img src={profile.logo} alt="Logo" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                            <Icon name="users" size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">{profile.brandName || profile.name}</p>
                          <p className="text-xs text-slate-600">{profile.phone} • {profile.city}</p>
                        </div>
                        {profile.isDefault && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">Default</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              <div className="flex gap-2">
                {customers.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                    className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                  >
                    <Icon name="users" size={14} /> Database Pelanggan
                  </button>
                )}
                {savedAddresses.length > 0 && (
                  <button onClick={() => {
                    const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0]
                    if (defaultAddr) selectAddress(defaultAddr)
                  }}
                    className="text-sm text-emerald-500 hover:text-emerald-600 font-medium flex items-center gap-1">
                    <Icon name="location" size={14} /> Buku Alamat
                  </button>
                )}
              </div>
            </div>
            
            {/* Customer Picker Modal */}
            {showCustomerPicker && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-semibold text-indigo-700 mb-3">Pilih Pelanggan:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map(cust => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => selectCustomerFromDB(cust)}
                      className="w-full text-left p-3 bg-white rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      <p className="font-semibold text-slate-800">{cust.name}</p>
                      <p className="text-sm text-slate-600">{cust.phone}</p>
                      {cust.address && <p className="text-xs text-slate-500 mt-1">{cust.address}</p>}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => setShowCustomerPicker(false)}
                  className="mt-3 text-sm text-slate-600 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>
            )}
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
              <button onClick={() => setItems([...items, { name: '', qty: 1, weight: 1, price: 0 }])}
                className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                <Icon name="plus" size={14} /> Tambah Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n) }}
                    placeholder="Nama barang" className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.qty} onChange={e => { const n = [...items]; n[i].qty = parseInt(e.target.value) || 0; setItems(n) }}
                    placeholder="Qty" min="1" className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.weight} onChange={e => { const n = [...items]; n[i].weight = parseFloat(e.target.value) || 0; setItems(n) }}
                    placeholder="Berat" step="0.1" className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
                  <input type="number" value={item.price || ''} onChange={e => { const n = [...items]; n[i].price = parseFloat(e.target.value) || 0; setItems(n) }}
                    placeholder="Harga" className="col-span-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800" />
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
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Metode Pembayaran</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                  <option>Tunai</option>
                  <option>Transfer Bank</option>
                  <option>E-Wallet (OVO/Dana/GoPay)</option>
                  <option>QRIS</option>
                  <option>Kartu Kredit/Debit</option>
                  <option>COD (Bayar di Tempat)</option>
                </select>
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
