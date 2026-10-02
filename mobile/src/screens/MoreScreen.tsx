// MoreScreen — pengganti sidebar web: launcher ke seluruh fitur native.

import React from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Card } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import type { RootStackParamList } from '../navigation/types'

type Nav = StackNavigationProp<RootStackParamList>

const menu: { nama: string; route: keyof RootStackParamList; desc: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { nama: 'Invoice', route: 'Invoice', desc: 'Buat & kelola invoice', icon: 'document-text-outline', color: '#2563eb' },
  { nama: 'Struk Penjualan', route: 'Struk', desc: 'Riwayat struk & cetak ulang', icon: 'receipt-outline', color: '#7c3aed' },
  { nama: 'Cash Flow', route: 'CashFlow', desc: 'Catat pemasukan & pengeluaran', icon: 'wallet-outline', color: '#059669' },
  { nama: 'Laporan Keuangan', route: 'Laporan', desc: 'Ringkasan laba rugi bulanan', icon: 'analytics-outline', color: '#0891b2' },
  { nama: 'Analitik', route: 'Analitik', desc: 'Statistik penjualan & produk', icon: 'bar-chart-outline', color: '#db2777' },
  { nama: 'Purchase Order', route: 'PurchaseOrder', desc: 'Pesanan ke supplier', icon: 'document-outline', color: '#ea580c' },
  { nama: 'Supplier', route: 'Supplier', desc: 'Data pemasok & kontak', icon: 'business-outline', color: '#4f46e5' },
  { nama: 'Utang & Piutang', route: 'UtangPiutang', desc: 'Pantau tagihan & cicilan', icon: 'cash-outline', color: '#dc2626' },
  { nama: 'Voucher & Promo', route: 'Voucher', desc: 'Diskon & kode promo', icon: 'pricetags-outline', color: '#ca8a04' },
  { nama: 'Loyalty', route: 'Loyalty', desc: 'Poin pelanggan & reward', icon: 'star-outline', color: '#f59e0b' },
  { nama: 'Karyawan', route: 'Karyawan', desc: 'Data tim & absensi', icon: 'people-circle-outline', color: '#0d9488' },
  { nama: 'QR Code', route: 'QR', desc: 'QR pembayaran & link toko', icon: 'qr-code-outline', color: '#334155' },
  { nama: 'Bundling Produk', route: 'Bundling', desc: 'Paket produk hemat', icon: 'cube-outline', color: '#9333ea' },
  { nama: 'Hitung Harga', route: 'HitungHarga', desc: 'Kalkulasi margin & HPP', icon: 'calculator-outline', color: '#16a34a' },
  { nama: 'Profil Toko', route: 'Profil', desc: 'Identitas & pengaturan toko', icon: 'storefront-outline', color: '#64748b' },
]

export default function MoreScreen() {
  const navigation = useNavigation<Nav>()
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Semua Fitur</Text>
      <Text style={styles.subtitle}>{menu.length + 4} fitur tersedia sebagai komponen native</Text>

      <View style={styles.grid}>
        {menu.map((m) => (
          <TouchableOpacity key={m.route} activeOpacity={0.7} onPress={() => navigation.navigate(m.route)}>
            <Card style={styles.item}>
              <View style={[styles.iconBox, { backgroundColor: m.color + '18' }]}>
                <Ionicons name={m.icon} size={24} color={m.color} />
              </View>
              <Text style={styles.nama} numberOfLines={1}>{m.nama}</Text>
              <Text style={styles.desc} numberOfLines={2}>{m.desc}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '47%', padding: spacing.md, flexGrow: 1 },
  iconBox: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  desc: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
})
