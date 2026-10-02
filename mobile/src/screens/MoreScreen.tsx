// MoreScreen — pengganti sidebar web: daftar fitur yang belum dikonversi.
// Menampilkan seluruh menu App.tsx versi web sebagai roadmap.

import React from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Badge } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'

const fiturKonversi: { nama: string; komponen: string; status: 'selesai' | 'menyusul'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { nama: 'Dashboard', komponen: 'Dashboard.tsx', status: 'selesai', icon: 'grid-outline' },
  { nama: 'Inventory', komponen: 'InventoryManager.tsx', status: 'selesai', icon: 'cube-outline' },
  { nama: 'POS / Kasir', komponen: 'POS.tsx', status: 'selesai', icon: 'cart-outline' },
  { nama: 'Pelanggan', komponen: 'CustomerManagement.tsx', status: 'selesai', icon: 'people-outline' },
  { nama: 'Invoice', komponen: 'InvoiceGenerator.tsx', status: 'menyusul', icon: 'document-text-outline' },
  { nama: 'Struk Penjualan', komponen: 'ReceiptGenerator.tsx', status: 'menyusul', icon: 'receipt-outline' },
  { nama: 'Cash Flow', komponen: 'CashFlowTracker.tsx', status: 'menyusul', icon: 'wallet-outline' },
  { nama: 'Analytics', komponen: 'EnhancedAnalytics.tsx', status: 'menyusul', icon: 'bar-chart-outline' },
  { nama: 'Purchase Order', komponen: 'PurchaseOrder.tsx', status: 'menyusul', icon: 'document-outline' },
  { nama: 'Supplier', komponen: 'SupplierManagement.tsx', status: 'menyusul', icon: 'business-outline' },
  { nama: 'Utang-Piutang', komponen: 'DebtManagement.tsx', status: 'menyusul', icon: 'cash-outline' },
  { nama: 'Voucher & Promo', komponen: 'VoucherManager.tsx', status: 'menyusul', icon: 'pricetags-outline' },
  { nama: 'Loyalty', komponen: 'LoyaltyProgram.tsx', status: 'menyusul', icon: 'star-outline' },
  { nama: 'Karyawan', komponen: 'EmployeeManagement.tsx', status: 'menyusul', icon: 'people-circle-outline' },
  { nama: 'QR Code', komponen: 'QRCodeGenerator.tsx', status: 'menyusul', icon: 'qr-code-outline' },
  { nama: 'Barcode Scanner', komponen: 'BarcodeScanner.tsx', status: 'menyusul', icon: 'barcode-outline' },
  { nama: 'WhatsApp Share', komponen: 'WhatsAppShare.tsx', status: 'menyusul', icon: 'logo-whatsapp' },
  { nama: 'Resi Pengiriman', komponen: 'ShippingReceipt.tsx', status: 'menyusul', icon: 'car-outline' },
]

export default function MoreScreen() {
  const selesai = fiturKonversi.filter((f) => f.status === 'selesai').length
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Semua Fitur</Text>
      <Text style={styles.subtitle}>{selesai}/{fiturKonversi.length} fitur sudah menjadi komponen native</Text>

      {fiturKonversi.map((f) => (
        <TouchableOpacity key={f.komponen} activeOpacity={f.status === 'selesai' ? 0.7 : 1}>
          <Card style={styles.item}>
            <View style={[styles.iconBox, {
              backgroundColor: f.status === 'selesai' ? colors.primaryLight : colors.bg,
            }]}>
              <Ionicons
                name={f.icon}
                size={22}
                color={f.status === 'selesai' ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{f.nama}</Text>
              <Text style={styles.meta}>src/components/{f.komponen}</Text>
            </View>
            <Badge
              label={f.status === 'selesai' ? 'Native ✓' : 'Menyusul'}
              variant={f.status === 'selesai' ? 'success' : 'warning'}
            />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
})
