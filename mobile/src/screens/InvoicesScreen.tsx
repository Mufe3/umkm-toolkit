// Konversi native dari src/components/InvoiceGenerator.tsx (web)
// Export PDF memakai expo-print (pengganti html2canvas/jsPDF) + share WhatsApp.

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId } from '../utils/storage'
import { exportInvoicePDF, shareWhatsApp, TokoInfo } from '../utils/exportUtils'

interface InvoiceItem { name: string; qty: number; price: number }
interface Customer { id: string; name: string; phone: string; email?: string; address?: string }
interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  customerId?: string
  customerPhone: string
  items: InvoiceItem[]
  total: number
  date: string
  dueDate: string
  status: 'paid' | 'unpaid'
  notes: string
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [toko, setToko] = useState<TokoInfo>({ nama: 'Toko Saya', alamat: '-', telepon: '-' })
  const [showForm, setShowForm] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  const [customer, setCustomer] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', qty: 1, price: 0 }])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const persist = (updated: Invoice[]) => {
    setInvoices(updated)
    saveItem('umkm_invoices', updated)
  }

  useEffect(() => {
    loadItem<Invoice[]>('umkm_invoices', []).then(setInvoices)
    loadItem<Customer[]>('umkm_customers', []).then(setCustomers)
    loadItem<any>('umkm_profile', {}).then((p) => {
      if (p?.nama || p?.storeName) setToko({ nama: p.nama ?? p.storeName ?? 'Toko Saya', alamat: p.alamat ?? p.address ?? '-', telepon: p.telepon ?? p.phone ?? '-' })
    })
  }, [])

  const total = items.reduce((s, i) => s + i.qty * i.price, 0)
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const pickCustomer = (c: Customer) => {
    setCustomer(c.name); setCustomerId(c.id); setCustomerPhone(c.phone)
  }

  const handleSubmit = () => {
    if (!customer || total <= 0) { Alert.alert('Perhatian', 'Pelanggan & minimal satu item wajib diisi!'); return }
    const inv: Invoice = {
      id: generateId(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customer, customerId, customerPhone,
      items: items.filter((i) => i.name), total,
      date: new Date().toISOString(), dueDate, status: 'unpaid', notes,
    }
    persist([inv, ...invoices])
    setCustomer(''); setCustomerId(''); setCustomerPhone('')
    setItems([{ name: '', qty: 1, price: 0 }]); setDueDate(''); setNotes('')
    setShowForm(false)
  }

  const togglePaid = (inv: Invoice) => {
    persist(invoices.map((x) => (x.id === inv.id ? { ...x, status: x.status === 'paid' ? 'unpaid' : 'paid' } : x)))
    setViewInvoice(null)
  }

  const deleteInvoice = (id: string) => {
    Alert.alert('Hapus invoice ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(invoices.filter((x) => x.id !== id)) },
    ])
  }

  const exportPDF = async (inv: Invoice) => {
    try {
      await exportInvoicePDF(toko, {
        nomor: inv.invoiceNumber,
        tanggal: formatDate(inv.date),
        pelanggan: inv.customer,
        items: inv.items.map((i) => ({ nama: i.name, qty: i.qty, harga: i.price })),
        total: inv.total,
        status: inv.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR',
      })
    } catch (e: any) {
      Alert.alert('Gagal export PDF', e?.message ?? String(e))
    }
  }

  const shareWA = (inv: Invoice) => {

    const list = inv.items.map((i) => `• ${i.name} (${i.qty}x)`).join('\n')
    shareWhatsApp(`Halo ${inv.customer},\n\nBerikut invoice *${inv.invoiceNumber}* dari ${toko.nama}:\n${list}\n\nTotal: *${formatRupiah(inv.total)}*\nJatuh tempo: ${inv.dueDate || '-'}\n\nTerima kasih!`)
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Invoice</Text>
      <Text style={styles.subtitle}>{invoices.filter((i) => i.status === 'unpaid').length} belum lunas</Text>

      <Button title="+ Buat Invoice" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={invoices}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada invoice" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setViewInvoice(item)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{item.invoiceNumber}</Text>
                <Text style={styles.meta}>{item.customer} • {formatDate(item.date)}</Text>
                <Text style={styles.total}>{formatRupiah(item.total)}</Text>
              </View>
              <Badge label={item.status === 'paid' ? 'Lunas' : 'Belum Bayar'} variant={item.status === 'paid' ? 'success' : 'danger'} />
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Detail */}
      <Modal visible={viewInvoice !== null} transparent animationType="fade" onRequestClose={() => setViewInvoice(null)}>
        <View style={styles.dialogWrap}>
          <View style={styles.dialog}>
            {viewInvoice && (
              <>
                <Text style={styles.sheetTitle}>{viewInvoice.invoiceNumber}</Text>
                <Text style={styles.meta}>Kepada: {viewInvoice.customer}{viewInvoice.customerPhone ? ` (${viewInvoice.customerPhone})` : ''}</Text>
                <Text style={styles.meta}>Tgl: {formatDate(viewInvoice.date)}{viewInvoice.dueDate ? ` • Jatuh tempo: ${formatDate(viewInvoice.dueDate)}` : ''}</Text>
                <View style={{ marginVertical: spacing.md }}>
                  {viewInvoice.items.map((it, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={{ flex: 1, color: colors.text }}>{it.name} × {it.qty}</Text>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{formatRupiah(it.qty * it.price)}</Text>
                    </View>
                  ))}
                  <Text style={[styles.total, { marginTop: spacing.sm }]}>Total: {formatRupiah(viewInvoice.total)}</Text>
                </View>
                {!!viewInvoice.notes && <Text style={styles.meta}>{viewInvoice.notes}</Text>}
                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title={viewInvoice.status === 'paid' ? 'Tandai Belum Bayar' : 'Tandai Lunas'}
                    variant={viewInvoice.status === 'paid' ? 'outline' : 'success'}
                    icon="checkmark-circle-outline"
                    onPress={() => togglePaid(viewInvoice)}
                  />
                  <Button title="Export PDF" icon="document-text-outline" onPress={() => exportPDF(viewInvoice)} />
                  <Button title="Kirim via WhatsApp" variant="outline" icon="logo-whatsapp" onPress={() => shareWA(viewInvoice)} />
                  <Button title="Hapus" variant="danger" icon="trash-outline" onPress={() => { deleteInvoice(viewInvoice.id); setViewInvoice(null) }} />
                  <Button title="Tutup" variant="outline" onPress={() => setViewInvoice(null)} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Form */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Buat Invoice</Text>
            {customers.length > 0 && (
              <>
                <Text style={styles.labelSmall}>Pilih Pelanggan</Text>
                <View style={styles.chipWrap}>
                  {customers.slice(0, 12).map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.chip, customerId === c.id && styles.chipActive]} onPress={() => pickCustomer(c)}>
                      <Text style={{ color: customerId === c.id ? colors.white : colors.textMuted, fontSize: fonts.small }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <Input label="Nama Pelanggan *" value={customer} onChangeText={(v) => { setCustomer(v); setCustomerId('') }} />
            <Input label="Telepon" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
            <Text style={styles.labelSmall}>Item</Text>
            {items.map((it, i) => (
              <View key={i} style={styles.formItemRow}>
                <View style={{ flex: 1 }}>
                  <Input placeholder="Nama barang" value={it.name} onChangeText={(v) => updateItem(i, { name: v })} />
                </View>
                <View style={{ width: 60 }}>
                  <Input placeholder="Qty" value={String(it.qty)} keyboardType="numeric" onChangeText={(v) => updateItem(i, { qty: Number(v) || 0 })} />
                </View>
                <View style={{ width: 90 }}>
                  <Input placeholder="Harga" value={String(it.price)} keyboardType="numeric" onChangeText={(v) => updateItem(i, { price: Number(v) || 0 })} />
                </View>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => setItems(items.filter((_, x) => x !== i))} style={{ alignSelf: 'center' }}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Button title="+ Tambah Item" variant="outline" icon="add-outline" onPress={() => setItems([...items, { name: '', qty: 1, price: 0 }])} />
            <Input label="Jatuh Tempo (yyyy-mm-dd)" value={dueDate} onChangeText={setDueDate} />
            <Input label="Catatan" value={notes} onChangeText={setNotes} multiline />
            <Text style={styles.total}>Total: {formatRupiah(total)}</Text>
            <Button title="Simpan Invoice" variant="success" icon="save-outline" onPress={handleSubmit} />
            <Button title="Batal" variant="outline" onPress={() => setShowForm(false)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  total: { fontSize: fonts.h3, fontWeight: '800', color: colors.primary, marginTop: 4 },
  itemRow: { flexDirection: 'row', paddingVertical: 4 },
  formItemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dialogWrap: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
