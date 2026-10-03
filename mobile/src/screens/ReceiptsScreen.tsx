// Konversi native dari src/components/ReceiptGenerator.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId } from '../utils/storage'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

interface Customer { id: string; name: string; phone: string }
interface ReceiptItem { name: string; qty: number; price: number }
interface Receipt {
  id: string
  receiptNumber: string
  storeName: string
  customerName: string
  customerId?: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  date: string
  notes: string
}

const PAY_METHODS = ['Cash', 'Transfer', 'QRIS', 'Kartu']

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null)
  const [storeName, setStoreName] = useState('Toko Saya')

  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<ReceiptItem[]>([{ name: '', qty: 1, price: 0 }])
  const [discount, setDiscount] = useState('')
  const [tax, setTax] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [notes, setNotes] = useState('')

  const persist = (updated: Receipt[]) => {
    setReceipts(updated)
    saveItem('umkm_receipts', updated)
  }

  useEffect(() => {
    loadItem<Receipt[]>('umkm_receipts', []).then(setReceipts)
    loadItem<Customer[]>('umkm_customers', []).then(setCustomers)
    loadItem<{ storeName?: string }>('umkm_store_settings', {}).then((s) => s.storeName && setStoreName(s.storeName))
  }, [])

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  const grandTotal = Math.max(subtotal - (Number(discount) || 0) + (Number(tax) || 0), 0)
  const updateItem = (idx: number, patch: Partial<ReceiptItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const handleSubmit = () => {
    if (subtotal <= 0) { Alert.alert('Perhatian', 'Minimal satu item dengan harga!'); return }
    const r: Receipt = {
      id: generateId(),
      receiptNumber: `STRUK-${Date.now().toString().slice(-6)}`,
      storeName, customerName: customerName || 'Umum', customerId,
      items: items.filter((i) => i.name), subtotal,
      discount: Number(discount) || 0, tax: Number(tax) || 0, total: grandTotal,
      paymentMethod, date: new Date().toISOString(), notes,
    }
    persist([r, ...receipts])
    setCustomerName(''); setCustomerId(''); setItems([{ name: '', qty: 1, price: 0 }])
    setDiscount(''); setTax(''); setNotes(''); setShowForm(false)
  }

  const shareWhatsApp = async (r: Receipt) => {
    const lines = [
      `*${r.storeName}*`,
      `${r.receiptNumber} — ${formatDate(r.date)}`,
      `Pelanggan: ${r.customerName}`,
      '---------------------',
      ...r.items.map((i) => `${i.name} x${i.qty}: ${formatRupiah(i.qty * i.price)}`),
      '---------------------',
      `Subtotal: ${formatRupiah(r.subtotal)}`,
      r.discount > 0 ? `Diskon: -${formatRupiah(r.discount)}` : '',
      r.tax > 0 ? `Pajak: ${formatRupiah(r.tax)}` : '',
      `TOTAL: ${formatRupiah(r.total)} (${r.paymentMethod})`,
    ].filter(Boolean).join('\n')
    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`
    try { await Linking.openURL(url) } catch { Alert.alert('Gagal', 'WhatsApp tidak tersedia.') }
  }

  const exportStrukPDF = async (r: Receipt) => {
    try {
      const rows = r.items.map((i) => `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${formatRupiah(i.price)}</td><td class="right">${formatRupiah(i.qty * i.price)}</td></tr>`).join('')
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
        body{font-family:'Roboto',monospace;color:#0f172a;padding:24px;max-width:320px;margin:0 auto}
        h2{text-align:center;font-size:16px} .c{text-align:center;color:#64748b;font-size:11px}
        table{width:100%;border-collapse:collapse;font-size:12px} td,th{padding:4px 2px;border-bottom:1px dashed #cbd5e1}
        .right{text-align:right} .tot{font-weight:800;font-size:14px;border-top:2px solid #0f172a}
      </style></head><body>
        <h2>${r.storeName.toUpperCase()}</h2>
        <p class="c">${r.receiptNumber}<br/>${formatDate(r.date)} • ${r.paymentMethod}</p>
        <p class="c">Pelanggan: ${r.customerName}</p>
        <table><tbody>${rows}
          <tr><td colspan="3">Subtotal</td><td class="right">${formatRupiah(r.subtotal)}</td></tr>
          ${r.discount ? `<tr><td colspan="3">Diskon</td><td class="right">-${formatRupiah(r.discount)}</td></tr>` : ''}
          ${r.tax ? `<tr><td colspan="3">Pajak</td><td class="right">+${formatRupiah(r.tax)}</td></tr>` : ''}
          <tr class="tot"><td colspan="3">TOTAL</td><td class="right">${formatRupiah(r.total)}</td></tr>
        </tbody></table>
        <p class="c" style="margin-top:16px">Terima kasih atas kunjungan Anda 🙏</p>
      </body></html>`
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Struk ${r.receiptNumber}` })
      } else {
        Alert.alert('Berhasil', `PDF tersimpan di:\n${uri}`)
      }
    } catch (e: any) {
      Alert.alert('Gagal export PDF', e?.message ?? String(e))
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Struk Penjualan</Text>
      <Text style={styles.subtitle}>{receipts.length} struk tersimpan</Text>

      <Button title="+ Buat Struk" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={receipts}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada struk" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setViewReceipt(item)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{item.receiptNumber}</Text>
                <Text style={styles.meta}>{item.customerName} • {formatDate(item.date)}</Text>
                <Text style={styles.total}>{formatRupiah(item.total)}</Text>
              </View>
              <Badge label={item.paymentMethod} variant="info" />
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Detail struk */}
      <Modal visible={viewReceipt !== null} transparent animationType="fade" onRequestClose={() => setViewReceipt(null)}>
        <View style={styles.dialogWrap}>
          <View style={styles.dialog}>
            {viewReceipt && (
              <>
                <Text style={[styles.sheetTitle, { textAlign: 'center' }]}>{viewReceipt.storeName}</Text>
                <Text style={[styles.meta, { textAlign: 'center' }]}>
                  {viewReceipt.receiptNumber} • {formatDate(viewReceipt.date)}
                </Text>
                <Text style={[styles.meta, { textAlign: 'center', marginBottom: spacing.md }]}>
                  Pelanggan: {viewReceipt.customerName}
                </Text>
                <View style={styles.dashedDivider} />
                {viewReceipt.items.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={{ flex: 1, color: colors.text }}>{it.name} × {it.qty}</Text>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{formatRupiah(it.qty * it.price)}</Text>
                  </View>
                ))}
                <View style={styles.dashedDivider} />
                <View style={styles.itemRow}><Text style={{ flex: 1, color: colors.textMuted }}>Subtotal</Text><Text style={styles.amt}>{formatRupiah(viewReceipt.subtotal)}</Text></View>
                {viewReceipt.discount > 0 && <View style={styles.itemRow}><Text style={{ flex: 1, color: colors.textMuted }}>Diskon</Text><Text style={[styles.amt, { color: colors.success }]}>{formatRupiah(-viewReceipt.discount)}</Text></View>}
                {viewReceipt.tax > 0 && <View style={styles.itemRow}><Text style={{ flex: 1, color: colors.textMuted }}>Pajak</Text><Text style={styles.amt}>{formatRupiah(viewReceipt.tax)}</Text></View>}
                <View style={styles.itemRow}>
                  <Text style={{ flex: 1, color: colors.text, fontWeight: '900', fontSize: fonts.h3 }}>TOTAL</Text>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: fonts.h3 }}>{formatRupiah(viewReceipt.total)}</Text>
                </View>
                <Text style={styles.meta}>Bayar: {viewReceipt.paymentMethod}</Text>
                {!!viewReceipt.notes && <Text style={styles.meta}>{viewReceipt.notes}</Text>}
                <View style={{ marginTop: spacing.md }}>
                  <Button title="Bagikan via WhatsApp" variant="success" icon="logo-whatsapp" onPress={() => shareWhatsApp(viewReceipt)} />
                  <Button title="Simpan Struk PDF" icon="document-text-outline" onPress={() => exportStrukPDF(viewReceipt)} />
                  <Button title="Tutup" variant="outline" onPress={() => setViewReceipt(null)} />
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
            <Text style={styles.sheetTitle}>Buat Struk</Text>
            {customers.length > 0 && (
              <>
                <Text style={styles.labelSmall}>Pelanggan</Text>
                <View style={styles.chipWrap}>
                  <TouchableOpacity style={[styles.chip, !customerId && styles.chipActive]} onPress={() => { setCustomerId(''); setCustomerName('') }}>
                    <Text style={{ color: !customerId ? colors.white : colors.textMuted, fontSize: fonts.small }}>Umum</Text>
                  </TouchableOpacity>
                  {customers.slice(0, 10).map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.chip, customerId === c.id && styles.chipActive]} onPress={() => { setCustomerId(c.id); setCustomerName(c.name) }}>
                      <Text style={{ color: customerId === c.id ? colors.white : colors.textMuted, fontSize: fonts.small }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <Input label="Nama Pelanggan" value={customerName} onChangeText={setCustomerName} placeholder="Umum" />
            <Text style={styles.labelSmall}>Item</Text>
            {items.map((it, i) => (
              <View key={i} style={styles.formItemRow}>
                <View style={{ flex: 1 }}>
                  <Input placeholder="Barang" value={it.name} onChangeText={(v) => updateItem(i, { name: v })} />
                </View>
                <View style={{ width: 56 }}>
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
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><Input label="Diskon (Rp)" value={discount} onChangeText={setDiscount} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Input label="Pajak (Rp)" value={tax} onChangeText={setTax} keyboardType="numeric" /></View>
            </View>
            <Text style={styles.labelSmall}>Metode Bayar</Text>
            <View style={styles.chipWrap}>
              {PAY_METHODS.map((m) => (
                <TouchableOpacity key={m} style={[styles.chip, paymentMethod === m && styles.chipActive]} onPress={() => setPaymentMethod(m)}>
                  <Text style={{ color: paymentMethod === m ? colors.white : colors.textMuted, fontSize: fonts.small }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Catatan" value={notes} onChangeText={setNotes} multiline />
            <Text style={styles.total}>Total: {formatRupiah(grandTotal)}</Text>
            <Button title="Simpan Struk" variant="success" icon="save-outline" onPress={handleSubmit} />
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
  amt: { color: colors.text, fontWeight: '600', fontSize: fonts.small },
  itemRow: { flexDirection: 'row', paddingVertical: 3 },
  formItemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dashedDivider: { borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed', marginVertical: spacing.sm },
  dialogWrap: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.sm, color: colors.text },
})
