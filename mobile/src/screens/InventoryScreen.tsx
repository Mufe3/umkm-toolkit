// InventoryScreen — konversi native dari src/components/InventoryManager.tsx
// <table> → FlatList, form HTML → TextInput, localStorage → AsyncStorage.

import React, { useEffect, useState, useCallback } from 'react'
import { FlatList, View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import { Card, Badge, Button, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, DEFAULT_PRODUK } from '../utils/storage'
import type { Produk } from '../utils/storage'

const emptyForm = { nama: '', kategori: '', hargaBeli: '', hargaJual: '', stok: '', minStok: '', satuan: 'pcs' }

export default function InventoryScreen() {
  const [produk, setProduk] = useState<Produk[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    loadItem<Produk[]>('produk', DEFAULT_PRODUK).then(setProduk)
  }, [])

  const persist = (next: Produk[]) => {
    setProduk(next)
    saveItem('produk', next)
  }

  const bukaForm = (p?: Produk) => {
    if (p) {
      setEditId(p.id)
      setForm({
        nama: p.nama, kategori: p.kategori,
        hargaBeli: String(p.hargaBeli), hargaJual: String(p.hargaJual),
        stok: String(p.stok), minStok: String(p.minStok), satuan: p.satuan,
      })
    } else {
      setEditId(null)
      setForm(emptyForm)
    }
    setModalOpen(true)
  }

  const simpan = () => {
    if (!form.nama.trim()) return
    const data: Produk = {
      id: editId ?? Date.now().toString(),
      nama: form.nama.trim(),
      kategori: form.kategori.trim() || 'Umum',
      hargaBeli: Number(form.hargaBeli) || 0,
      hargaJual: Number(form.hargaJual) || 0,
      stok: Number(form.stok) || 0,
      minStok: Number(form.minStok) || 0,
      satuan: form.satuan || 'pcs',
    }
    const next = editId ? produk.map((p) => (p.id === editId ? data : p)) : [...produk, data]
    persist(next)
    setModalOpen(false)
  }

  const hapus = useCallback((id: string) => {
    persist(produk.filter((p) => p.id !== id))
  }, [produk])

  const renderItem = ({ item }: { item: Produk }) => {
    const habis = item.stok <= 0
    const menipis = !habis && item.stok <= item.minStok
    return (
      <Card>
        <View style={styles.itemHeader}>
          <Text style={styles.nama}>{item.nama}</Text>
          <Badge
            label={habis ? 'Habis' : menipis ? 'Menipis' : 'Aman'}
            variant={habis ? 'danger' : menipis ? 'warning' : 'success'}
          />
        </View>
        <Text style={styles.meta}>{item.kategori} • Stok: {item.stok} {item.satuan}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.jual}>{formatRupiah(item.hargaJual)}</Text>
          <Text style={styles.beli}>Beli: {formatRupiah(item.hargaBeli)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => bukaForm(item)}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => hapus(item.id)}>
            <Text style={[styles.actionText, { color: colors.danger }]}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </Card>
    )
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={produk}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={{ padding: spacing.md, paddingBottom: 0 }}>
            <Text style={styles.title}>Inventory</Text>
            <Button title="+ Tambah Produk" icon="add-circle-outline" onPress={() => bukaForm()} />
          </View>
        }
        ListEmptyComponent={<EmptyState text="Belum ada produk" />}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
      />

      {/* Modal form pengganti <form> HTML */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setModalOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{editId ? 'Edit Produk' : 'Tambah Produk'}</Text>
            <Input label="Nama Produk" value={form.nama} onChangeText={(t) => setForm({ ...form, nama: t })} placeholder="cth: Beras 5kg" />
            <Input label="Kategori" value={form.kategori} onChangeText={(t) => setForm({ ...form, kategori: t })} placeholder="Pangan / Non-pangan" />
            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Input label="Harga Beli" keyboardType="numeric" value={form.hargaBeli} onChangeText={(t) => setForm({ ...form, hargaBeli: t })} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Harga Jual" keyboardType="numeric" value={form.hargaJual} onChangeText={(t) => setForm({ ...form, hargaJual: t })} />
              </View>
            </View>
            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Input label="Stok" keyboardType="numeric" value={form.stok} onChangeText={(t) => setForm({ ...form, stok: t })} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Stok Minimum" keyboardType="numeric" value={form.minStok} onChangeText={(t) => setForm({ ...form, minStok: t })} />
              </View>
            </View>
            <Button title="Simpan" variant="success" icon="save-outline" onPress={simpan} />
            <Button title="Batal" variant="outline" onPress={() => setModalOpen(false)} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nama: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, flex: 1 },
  meta: { fontSize: fonts.small, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  jual: { fontSize: fonts.body, fontWeight: '800', color: colors.success },
  beli: { fontSize: fonts.small, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  deleteBtn: { backgroundColor: colors.dangerLight },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: fonts.small },
  backdrop: { flex: 1, backgroundColor: '#0f172a99', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  rowTwo: { flexDirection: 'row', gap: spacing.sm },
})
