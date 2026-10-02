// DashboardScreen — konversi native dari src/components/Dashboard.tsx
// <div class="grid"> → FlatList/ScrollView + flexRow, Tailwind → StyleSheet.

import React, { useEffect, useState } from 'react'
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Card, StatCard, Badge } from '../components/UI'
import { colors, spacing, fonts } from '../theme'
import { loadItem, formatRupiah, DEFAULT_PRODUK } from '../utils/storage'
import type { Produk, Transaksi } from '../utils/storage'

export default function DashboardScreen() {
  const [produk, setProduk] = useState<Produk[]>(DEFAULT_PRODUK)
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pengganti localStorage sinkron di web → AsyncStorage asinkron
    Promise.all([
      loadItem<Produk[]>('produk', DEFAULT_PRODUK),
      loadItem<Transaksi[]>('transaksi', []),
    ])
      .then(([p, t]) => {
        setProduk(p)
        setTransaksi(t)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalPenjualan = transaksi
    .filter((t) => t.tipe === 'penjualan')
    .reduce((s, t) => s + t.total, 0)
  const totalStok = produk.reduce((s, p) => s + p.stok, 0)
  const stokMenipis = produk.filter((p) => p.stok <= p.minStok)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        {loading ? 'Memuat data...' : `${produk.length} produk, ${transaksi.length} transaksi`}
      </Text>

      {/* Grid statistik: flexWrap menggantikan grid-cols-2 */}
      <View style={styles.grid}>
        <StatCard title="Total Penjualan" value={formatRupiah(totalPenjualan)} icon="cart-outline" color={colors.success} />
        <StatCard title="Total Stok" value={`${totalStok} item`} icon="cube-outline" color={colors.primary} />
        <StatCard title="Produk" value={`${produk.length}`} icon="pricetag-outline" color={colors.info} />
        <StatCard title="Stok Menipis" value={`${stokMenipis.length}`} icon="warning-outline" color={colors.danger} />
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Perlu Restok</Text>
        {stokMenipis.length === 0 ? (
          <Text style={styles.muted}>Semua stok aman 👍</Text>
        ) : (
          stokMenipis.map((p) => (
            <View key={p.id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{p.nama}</Text>
                <Text style={styles.muted}>Sisa {p.stok} {p.satuan} (min. {p.minStok})</Text>
              </View>
              <Badge label="Restok" variant="danger" />
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
        {transaksi.length === 0 ? (
          <Text style={styles.muted}>Belum ada transaksi. Buka tab Kasir untuk menjual.</Text>
        ) : (
          transaksi.slice(-5).reverse().map((t) => (
            <View key={t.id} style={styles.rowItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{t.deskripsi}</Text>
                <Text style={styles.muted}>{t.tanggal}</Text>
              </View>
              <Text style={[styles.amount, t.tipe === 'penjualan' ? styles.positive : styles.negative]}>
                {formatRupiah(t.total)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  sectionTitle: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  rowItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemName: { fontSize: fonts.body, fontWeight: '600', color: colors.text },
  muted: { fontSize: fonts.small, color: colors.textMuted },
  amount: { fontSize: fonts.body, fontWeight: '700' },
  positive: { color: colors.success },
  negative: { color: colors.danger },
})
