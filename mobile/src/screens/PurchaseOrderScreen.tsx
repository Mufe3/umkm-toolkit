// Konversi native dari src/components/PurchaseOrder.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId } from '../utils/storage'

interface POItem { productName: string; qty: number; price: number }
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

const statusMap: Record<PurchaseOrder['status'], { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }> = {
  pending: { label: 'Draft', variant: 'warning' },
  ordered: { label: 'Dipesan', variant: 'info' },
  received: { label: 'Diterima', variant: 'success' },
  cancelled: { label: 'Batal', variant: 'danger' },
}

export default function PurchaseOrderScreen() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'ordered' | 'received'>('all')

  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState<POItem[]>([{ productName: '', qty: 1, price: 0 }])
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')

  const persist = (updated: PurchaseOrder[]) => {
    setOrders(updated)
    saveItem('umkm_purchase_orders', updated)
  }

  useEffect(() => {
    loadItem<PurchaseOrder[]>('umkm_purchase_orders', []).then(setOrders)
  }, [])

  const total = items.reduce((s, i) => s + i.qty * i.price, 0)

  const updateItem = (idx: number, patch: Partial<POItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const handleSubmit = () => {
    if (!supplier || total <= 0) { Alert.alert('Perhatian', 'Supplier & minimal satu item wajib diisi!'); return }
    const po: PurchaseOrder = {
      id: generateId(),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplier, items: items.filter((i) => i.productName), total,
      date: new Date().toISOString(), expectedDate, status: 'pending', notes,
    }
    persist([po, ...orders])
    setSupplier(''); setItems([{ productName: '', qty: 1, price: 0 }]); setExpectedDate(''); setNotes('')
    setShowForm(false)
  }

  const setStatus = (po: PurchaseOrder, status: PurchaseOrder['status']) => {
    persist(orders.map((o) => (o.id === po.id ? { ...o, status } : o)))
    setViewOrder(null)
  }

  const list = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Purchase Order</Text>
      <Text style={styles.subtitle}>Pesanan ke supplier</Text>

      <Segmented
        options={[
          { label: 'Semua', value: 'all' }, { label: 'Draft', value: 'pending' },
          { label: 'Dipesan', value: 'ordered' }, { label: 'Diterima', value: 'received' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <Button title="+ Buat PO" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada purchase order" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setViewOrder(item)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{item.poNumber}</Text>
                <Text style={styles.meta}>{item.supplier} • {formatDate(item.date)}</Text>
                <Text style={styles.total}>{formatRupiah(item.total)}</Text>
              </View>
              <Badge label={statusMap[item.status].label} variant={statusMap[item.status].variant} />
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Detail PO */}
      <Modal visible={viewOrder !== null} transparent animationType="fade" onRequestClose={() => setViewOrder(null)}>
        <View style={styles.dialogWrap}>
          <View style={styles.dialog}>
            {viewOrder && (
              <>
                <Text style={styles.sheetTitle}>{viewOrder.poNumber}</Text>
                <Text style={styles.meta}>Kepada: {viewOrder.supplier}</Text>
                <Text style={styles.meta}>Tgl: {formatDate(viewOrder.date)}{viewOrder.expectedDate ? ` • Estimasi tiba: ${formatDate(viewOrder.expectedDate)}` : ''}</Text>
                <View style={{ marginVertical: spacing.md }}>
                  {viewOrder.items.map((it, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={{ flex: 1, color: colors.text }}>{it.productName} × {it.qty}</Text>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{formatRupiah(it.qty * it.price)}</Text>
                    </View>
                  ))}
                  <Text style={[styles.total, { marginTop: spacing.sm }]}>Total: {formatRupiah(viewOrder.total)}</Text>
                </View>
                {!!viewOrder.notes && <Text style={styles.meta}>{viewOrder.notes}</Text>}
                <View style={{ marginTop: spacing.md }}>
                  {viewOrder.status === 'pending' && <Button title="Tandai Dipesan" icon="send-outline" onPress={() => setStatus(viewOrder, 'ordered')} />}
                  {viewOrder.status === 'ordered' && <Button title="Tandai Diterima" variant="success" icon="checkmark-done-outline" onPress={() => setStatus(viewOrder, 'received')} />}
                  {viewOrder.status !== 'received' && viewOrder.status !== 'cancelled' && (
                    <Button title="Batalkan" variant="danger" icon="close-circle-outline" onPress={() => setStatus(viewOrder, 'cancelled')} />
                  )}
                  <Button title="Tutup" variant="outline" onPress={() => setViewOrder(null)} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Form PO */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Buat Purchase Order</Text>
            <Input label="Supplier *" value={supplier} onChangeText={setSupplier} />
            <Text style={styles.labelSmall}>Item Pesanan</Text>
            {items.map((it, i) => (
              <View key={i} style={styles.formItemRow}>
                <View style={{ flex: 1 }}>
                  <Input placeholder="Nama barang" value={it.productName} onChangeText={(v) => updateItem(i, { productName: v })} />
                </View>
                <View style={{ width: 64 }}>
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
            <Button title="+ Tambah Item" variant="outline" icon="add-outline" onPress={() => setItems([...items, { productName: '', qty: 1, price: 0 }])} />
            <Input label="Estimasi Tiba (yyyy-mm-dd)" value={expectedDate} onChangeText={setExpectedDate} placeholder="opsional" />
            <Input label="Catatan" value={notes} onChangeText={setNotes} multiline />
            <Text style={styles.total}>Total: {formatRupiah(total)}</Text>
            <Button title="Simpan PO" variant="success" icon="save-outline" onPress={handleSubmit} />
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
  dialogWrap: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '80%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
})
