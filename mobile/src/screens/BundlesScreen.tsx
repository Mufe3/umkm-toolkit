// Konversi native dari src/components/ProductBundle.tsx (web)
// Paket/bundle produk dengan harga combo — data disimpan di AsyncStorage.

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, generateId, Produk } from '../utils/storage'

interface BundleItem { productId: string; qty: number }
interface Bundle {
  id: string
  name: string
  items: BundleItem[]
  bundlePrice: number
  active: boolean
}

export default function BundlesScreen() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [products, setProducts] = useState<Produk[]>([])
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [sel, setSel] = useState<Record<string, number>>({})
  const [bundlePrice, setBundlePrice] = useState('')

  const persist = (updated: Bundle[]) => {
    setBundles(updated)
    saveItem('umkm_bundles', updated)
  }

  useEffect(() => {
    loadItem<Bundle[]>('umkm_bundles', []).then(setBundles)
    loadItem<Produk[]>('umkm_products', []).then(setProducts)
  }, [])

  const normalPrice = Object.entries(sel).reduce((s, [id, q]) => {
    const p = products.find((x) => x.id === id)
    return s + (p ? p.hargaJual * q : 0)
  }, 0)

  const toggleProduct = (id: string) => {
    const next = { ...sel }
    if (next[id]) delete next[id]
    else next[id] = 1
    setSel(next)
  }

  const handleSubmit = () => {
    const price = Number(bundlePrice) || 0
    if (!name || Object.keys(sel).length < 2 || price <= 0) {
      Alert.alert('Perhatian', 'Butuh nama, minimal 2 produk, dan harga paket!')
      return
    }
    persist([
      { id: generateId(), name, items: Object.entries(sel).map(([productId, qty]) => ({ productId, qty })), bundlePrice: price, active: true },
      ...bundles,
    ])
    setName(''); setSel({}); setBundlePrice(''); setShowForm(false)
  }

  const deleteBundle = (id: string) => {
    Alert.alert('Hapus paket ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(bundles.filter((b) => b.id !== id)) },
    ])
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Paket Produk</Text>
      <Text style={styles.subtitle}>{bundles.length} bundling aktif</Text>

      <Button title="+ Buat Paket" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={bundles}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada paket produk" />}
        renderItem={({ item }) => {
          const orig = item.items.reduce((s, it) => {
            const p = products.find((x) => x.id === it.productId)
            return s + (p ? p.hargaJual * it.qty : 0)
          }, 0)
          const hemat = orig > item.bundlePrice ? orig - item.bundlePrice : 0
          return (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.nama}>{item.name}</Text>
                {hemat > 0 && <Badge label={`Hemat ${formatRupiah(hemat)}`} variant="success" />}
              </View>
              {item.items.map((it, i) => {
                const p = products.find((x) => x.id === it.productId)
                return <Text key={i} style={styles.meta}>• {p ? p.nama : '(produk dihapus)'} × {it.qty}</Text>
              })}
              <Text style={styles.price}>{formatRupiah(item.bundlePrice)}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteBundle(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>Hapus</Text>
              </TouchableOpacity>
            </Card>
          )
        }}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Buat Paket Produk</Text>
            <Input label="Nama Paket *" value={name} onChangeText={setName} placeholder="cth: Paket Sarungan" />
            <Text style={styles.labelSmall}>Pilih Produk (min. 2)</Text>
            {products.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.prodRow, !!sel[p.id] && styles.prodRowActive]} onPress={() => toggleProduct(p.id)}>
                <Ionicons name={sel[p.id] ? 'checkbox' : 'square-outline'} size={20} color={sel[p.id] ? colors.primary : colors.textMuted} />
                <Text style={{ flex: 1, color: colors.text }}>{p.nama}</Text>
                <Text style={styles.meta}>{formatRupiah(p.hargaJual)}</Text>
              </TouchableOpacity>
            ))}
            {products.length === 0 && <EmptyState text="Belum ada produk — tambahkan di tab Inventory" />}
            <Input label="Harga Paket (Rp) *" value={bundlePrice} onChangeText={setBundlePrice} keyboardType="numeric" />
            {normalPrice > 0 && <Text style={styles.meta}>Harga normal: {formatRupiah(normalPrice)}</Text>}
            <Button title="Simpan Paket" variant="success" icon="save-outline" onPress={handleSubmit} />
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
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: fonts.h3, fontWeight: '900', color: colors.primary, marginTop: 6 },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 8, backgroundColor: colors.white },
  prodRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
