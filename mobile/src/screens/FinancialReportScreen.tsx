// Konversi native dari src/components/FinancialReport.tsx (web)
// Recharts & export XLSX diganti batang View — sumber data umkm_transactions.

import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Card, Button, Segmented, StatCard, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, formatRupiah } from '../utils/storage'
import { exportReportPDF, shareWhatsApp, TokoInfo } from '../utils/exportUtils'

interface Transaction { id: string; type: 'income' | 'expense'; amount: number; category: string; description: string; date: string }
type Period = 'week' | 'month' | 'year' | 'all'

export default function FinancialReportScreen() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [period, setPeriod] = useState<Period>('month')
  const [toko, setToko] = useState<TokoInfo>({ nama: 'Toko Saya', alamat: '-', telepon: '-' })

  useEffect(() => {
    loadItem<Transaction[]>('umkm_transactions', []).then(setTxs)
    loadItem<any>('umkm_profile', {}).then((p) => {
      if (p?.nama || p?.storeName) setToko({ nama: p.nama ?? p.storeName ?? 'Toko Saya', alamat: p.alamat ?? p.address ?? '-', telepon: p.telepon ?? p.phone ?? '-' })
    })
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    return txs.filter((t) => {
      const d = new Date(t.date)
      if (period === 'week') return d >= new Date(now.getTime() - 7 * 864e5)
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'year') return d.getFullYear() === now.getFullYear()
      return true
    })
  }, [txs, period])

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit = income - expense
  const margin = income > 0 ? (profit / income) * 100 : 0

  // data bulanan tahun ini
  const monthly = useMemo(() => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const y = new Date().getFullYear()
    return names.map((label, i) => {
      const m = filtered.filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === y && d.getMonth() === i
      })
      return {
        label,
        income: m.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: m.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [filtered])
  const maxVal = Math.max(...monthly.flatMap((m) => [m.income, m.expense]), 1)

  const periodLabel = { week: '7 Hari Terakhir', month: 'Bulan Ini', year: String(new Date().getFullYear()), all: 'Semua Periode' }[period]

  const breakdown = useMemo(() => {
    const byCat: Record<string, number> = {}
    filtered.filter((t) => t.type === 'expense').forEach((t) => { byCat[t.category || 'Lainnya'] = (byCat[t.category || 'Lainnya'] || 0) + t.amount })
    return Object.entries(byCat).map(([label, nilai]) => ({ label, nilai }))
  }, [filtered])

  const doExportPDF = async () => {
    try {
      await exportReportPDF(toko, periodLabel, { pemasukan: income, pengeluaran: expense, laba: profit, breakdown })
    } catch (e: any) { Alert.alert('Gagal export PDF', e?.message ?? String(e)) }
  }

  const doShareWA = () => {
    shareWhatsApp(`*Laporan ${toko.nama}* (${periodLabel})\n\nMasuk: ${formatRupiah(income)}\nKeluar: ${formatRupiah(expense)}\n${profit >= 0 ? 'Laba' : 'Rugi'}: *${formatRupiah(Math.abs(profit))}*`)
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Laporan Keuangan</Text>
      <Text style={styles.subtitle}>Laba rugi sederhana dari pencatatan cash flow</Text>

      <Segmented
        options={[
          { label: 'Minggu', value: 'week' }, { label: 'Bulan', value: 'month' },
          { label: 'Tahun', value: 'year' }, { label: 'Semua', value: 'all' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard title="Total Masuk" value={formatRupiah(income)} icon="arrow-down-circle-outline" color={colors.success} />
        <StatCard title="Total Keluar" value={formatRupiah(expense)} icon="arrow-up-circle-outline" color={colors.danger} />
      </View>

      <Card>
        <Text style={styles.rowLine}><Text style={styles.muted}>Laba Bersih</Text></Text>
        <Text style={[styles.profit, { color: profit >= 0 ? colors.success : colors.danger }]}>{formatRupiah(profit)}</Text>
        <Text style={styles.muted}>Margin laba: {margin.toFixed(1)}%</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Perbandingan Bulanan (Tahun Ini)</Text>
        {filtered.length === 0 && <EmptyState text="Belum ada transaksi pada periode ini" />}
        <View style={styles.chartRow}>
          {monthly.map((m, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ height: 120, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                <View style={[styles.bar, { height: Math.max((m.income / maxVal) * 120, 2), backgroundColor: colors.success, opacity: m.income ? 1 : 0.2 }]} />
                <View style={[styles.bar, { height: Math.max((m.expense / maxVal) * 120, 2), backgroundColor: colors.danger, opacity: m.expense ? 1 : 0.2 }]} />
              </View>
              <Text style={styles.dayLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} /><Text style={styles.muted}>Masuk</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} /><Text style={styles.muted}>Keluar</Text>
          </View>
        </View>
      </Card>

      {breakdown.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Rincian Pengeluaran per Kategori</Text>
          {breakdown.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text style={{ color: colors.text, fontSize: fonts.body }}>{b.label}</Text>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: fonts.body }}>{formatRupiah(b.nilai)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Button title="Export PDF Laporan" icon="document-text-outline" onPress={doExportPDF} />
      <Button title="Kirim via WhatsApp" variant="outline" icon="logo-whatsapp" onPress={doShareWA} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  rowLine: { marginBottom: 2 },
  muted: { color: colors.textMuted, fontSize: fonts.small },
  profit: { fontSize: fonts.h1, fontWeight: '900', marginVertical: 4 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end' },
  bar: { width: 10, borderRadius: radius.sm },
  dayLabel: { fontSize: fonts.tiny, color: colors.textMuted },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: radius.full },
})
