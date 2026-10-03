// POSScreen — konversi native dari src/components/POS.tsx
// Keranjang belanja + checkout, tersambung ke data inventory (AsyncStorage).

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native'
import { Card, Button, Badge } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, DEFAULT_PRODUK } from '../utils/storage'
import type { Produk, Transaksi } from '../utils/storage'

interface CartItem { produk: Produk; qty: number }

export default function POSScreen() {
  const [produk, setProduk] = useState<Produk[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    loadItem<Produk[]>('produk', DEFAULT_PRODUK).then(setProduk)
  }, [])

  const tambahKeKeranjang = (p: Produk) => {
    if (p.stok <= 0) {
      Alert.alert('Stok habis', `${p.nama} sedang tidak tersedia.`)
      return
    }
    setCart((prev) => {
      const found = prev.find((c) => c.produk.id === p.id)
      if (found) {
        if (found.qty >= p.stok) {
          Alert.alert('Melebihi stok', `Sisa stok ${p.nama} hanya ${p.stok}.`)
          return prev
        }
        return prev.map((c) => (c.produk.id === p.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { produk: p, qty: 1 }]
    })
  }

  const ubahQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.produk.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    )
  }

  const total = cart.reduce((s, c) => s + c.produk.hargaJual * c.qty, 0)

  const checkout = async () => {
    if (cart.length === 0) return
    // Kurangi stok & simpan transaksi (logika sama dengan POS versi web)
    const nextProduk = produk.map((p) => {
      const inCart = cart.find((c) => c.produk.id === p.id)
      return inCart ? { ...p, stok: p.stok - inCart.qty } : p
    })
    const transaksiBaru: Transaksi = {
      id: Date.now().toString(),
      tanggal: new Date().toLocaleDateString('id-ID'),
      tipe: 'penjualan',
      total,
      deskripsi: `${cart.reduce((s, c) => s + c.qty, 0)} item`,
    }
    const riwayat = await loadItem<Transaksi[]>('transaksi', [])
    await Promise.all([
      saveItem('produk', nextProduk),
      saveItem('transaksi', [...riwayat, transaksiBaru]),
    ])
    setProduk(nextProduk)
    setCart([])
    Alert.alert('Berhasil ✅', `Transaksi ${formatRupiah(total)} tersimpan.`)
  }

  return (
    <View style={styles.screen}>
      {/* Daftar produk */}
      <FlatList
        data={produk}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md }}
        ListHeaderComponent={<Text style={styles.title}>Kasir (POS)</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => tambahKeKeranjang(item)}>
            <Card style={styles.prodCard}>
              <Text style={styles.prodName} numberOfLines={2}>{item.nama}</Text>
              <Text style={styles.prodPrice}>{formatRupiah(item.hargaJual)}</Text>
              <Badge label={`Stok ${item.stok}`} variant={item.stok <= item.minStok ? 'warning' : 'success'} />
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Keranjang + tombol bayar */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {cart.map((c) => (
              <View key={c.produk.id} style={styles.cartChip}>
                <Text style={styles.cartChipName} numberOfLines={1}>{c.produk.nama}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => ubahQty(c.produk.id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{c.qty}</Text>
                  <TouchableOpacity onPress={() => ubahQty(c.produk.id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ width: 130 }}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
            <Button title="Bayar" variant="success" icon="checkmark-circle" onPress={checkout} />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, width: '100%' },
  prodCard: { flex: 1, gap: 4 },
  prodName: { fontSize: fonts.body, fontWeight: '700', color: colors.text, minHeight: 40 },
  prodPrice: { fontSize: fonts.body, fontWeight: '800', color: colors.success },
  cartBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  cartChip: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginRight: spacing.sm, minWidth: 110 },
  cartChipName: { fontSize: fonts.small, fontWeight: '700', color: colors.primaryDark, width: 110 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn: { width: 26, height: 26, borderRadius: radius.full, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: fonts.h3, fontWeight: '800', color: colors.primary },
  qtyValue: { fontSize: fonts.body, fontWeight: '800', color: colors.text, minWidth: 20, textAlign: 'center' },
  totalLabel: { fontSize: fonts.tiny, color: colors.textMuted },
  totalValue: { fontSize: fonts.h3, fontWeight: '800', color: colors.text, marginBottom: 4 },
})
