// Konversi native dari src/components/EnhancedAnalytics.tsx (web)
// Grafik recharts diganti batang View proporsional — tanpa library tambahan.

import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Card, Segmented, StatCard, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, formatRupiah, formatDate } from '../utils/storage'

interface Receipt { id: string; date: string; total: number; items: Array<{ name: string; qty: number; price: number }> }
interface Produk { id: string; nama: string; kategori: string; hargaJual: number; stok: number }

type Range = 'week' | 'month' | 'all'

export default function AnalyticsScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [products, setProducts] = useState<Produk[]>([])
  const [range, setRange] = useState<Range>('month')

  useEffect(() => {
    loadItem<Receipt[]>('umkm_receipts', []).then(setReceipts)
    loadItem<Produk[]>('umkm_products', []).then(setProducts)
  }, [])

  const inRange = useMemo(() => {
    const now = new Date()
    return receipts.filter((r) => {
      const d = new Date(r.date)
      if (range === 'week') return d >= new Date(now.getTime() - 7 * 864e5)
      if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return true
    })
  }, [receipts, range])

  const revenue = inRange.reduce((s, r) => s + r.total, 0)
  const avg = inRange.length ? revenue / inRange.length : 0
  const lowStock = products.filter((p) => p.stok <= (((p as any).minStok ?? 5) as number))

  // produk terlaris berdasarkan item struk
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {}
    inRange.forEach((r) =>
      r.items.forEach((i) => {
        const cur = map[i.name] || { qty: 0, revenue: 0 }
        map[i.name] = { qty: cur.qty + i.qty, revenue: cur.revenue + i.qty * i.price }
      }),
    )
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [inRange])
  const maxRev = Math.max(...topProducts.map((p) => p.revenue), 1)

  // penjualan harian 7 hari terakhir
  const daily = useMemo(() => {
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5)
      const key = d.toISOString().split('T')[0]
      const val = receipts.filter((r) => r.date.startsWith(key)).reduce((s, r) => s + r.total, 0)
      days.push({ label: String(d.getDate()), value: val })
    }
    return days
  }, [receipts])
  const maxDaily = Math.max(...daily.map((d) => d.value), 1)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Analitik</Text>
      <Text style={styles.subtitle}>Ringkasan performa usaha</Text>

      <Segmented
        options={[{ label: '7 Hari', value: 'week' }, { label: 'Bulan Ini', value: 'month' }, { label: 'Semua', value: 'all' }]}
        value={range}
        onChange={setRange}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard title="Omzet" value={formatRupiah(revenue)} icon="cash-outline" color={colors.primary} />
        <StatCard title="Transaksi" value={String(inRange.length)} icon="receipt-outline" color={colors.info} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard title="Rata-rata/Struk" value={formatRupiah(avg)} icon="trending-up-outline" color={colors.success} />
        <StatCard title="Stok Menipis" value={String(lowStock.length)} icon="alert-circle-outline" color={colors.warning} />
      </View>

      <Card>
        <Text style={styles.cardTitle}>Penjualan 7 Hari Terakhir</Text>
        <View style={styles.chartRow}>
          {daily.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={[styles.bar, { height: Math.max((d.value / maxDaily) * 120, 3), opacity: d.value ? 1 : 0.25 }]} />
              <Text style={styles.dayLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Produk Terlaris</Text>
        {topProducts.length === 0 && <EmptyState text="Belum ada data penjualan" />}
        {topProducts.map((p, i) => (
          <View key={p.name} style={{ marginBottom: spacing.sm }}>
            <View style={styles.topRow}>
              <Text style={styles.topName}>{i + 1}. {p.name}</Text>
              <Text style={styles.topMeta}>{p.qty}× • {formatRupiah(p.revenue)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(p.revenue / maxRev) * 100}%` }]} />
            </View>
          </View>
        ))}
      </Card>

      {lowStock.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Perlu Restok</Text>
          {lowStock.map((p) => (
            <View key={p.id} style={styles.lowRow}>
              <Text style={{ flex: 1, color: colors.text }}>{p.nama}</Text>
              <Text style={{ color: colors.danger, fontWeight: '800' }}>sisa {p.stok}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 150 },
  bar: { width: '70%', borderRadius: radius.sm, backgroundColor: colors.primary },
  dayLabel: { fontSize: fonts.tiny, color: colors.textMuted },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topName: { fontSize: fonts.small, color: colors.text, fontWeight: '600', flex: 1 },
  topMeta: { fontSize: fonts.tiny, color: colors.textMuted },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.border, marginTop: 4 },
  fill: { height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  lowRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
})
