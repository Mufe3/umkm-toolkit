// Konversi native dari src/components/VoucherManager.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId } from '../utils/storage'

interface Voucher {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  maxDiscount: number
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  active: boolean
  description: string
}

export default function VouchersScreen() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Voucher | null>(null)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)

  const persist = (updated: Voucher[]) => {
    setVouchers(updated)
    saveItem('umkm_vouchers', updated)
  }

  useEffect(() => {
    loadItem<Voucher[]>('umkm_vouchers', []).then(setVouchers)
  }, [])

  const openForm = (v?: Voucher) => {
    if (v) {
      setEditing(v); setCode(v.code); setName(v.name); setType(v.type); setValue(String(v.value))
      setMinPurchase(String(v.minPurchase)); setUsageLimit(String(v.usageLimit))
      setStartDate(v.startDate); setEndDate(v.endDate); setDescription(v.description); setActive(v.active)
    } else {
      setEditing(null); setCode(''); setName(''); setType('percentage'); setValue('')
      setMinPurchase(''); setUsageLimit(''); setStartDate(''); setEndDate(''); setDescription(''); setActive(true)
    }
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!code || !name || !Number(value)) { Alert.alert('Perhatian', 'Kode, nama & nilai voucher wajib diisi!'); return }
    const base = {
      code: code.toUpperCase(), name, type, value: Number(value),
      minPurchase: Number(minPurchase) || 0, maxDiscount: 0,
      usageLimit: Number(usageLimit) || 0, startDate, endDate, active, description,
    }
    if (editing) {
      persist(vouchers.map((v) => (v.id === editing.id ? { ...v, ...base } : v)))
    } else {
      persist([{ id: generateId(), usedCount: 0, ...base }, ...vouchers])
    }
    setShowForm(false)
  }

  const toggleActive = (v: Voucher) =>
    persist(vouchers.map((x) => (x.id === v.id ? { ...x, active: !x.active } : x)))

  const deleteVoucher = (id: string) => {
    Alert.alert('Hapus voucher ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(vouchers.filter((v) => v.id !== id)) },
    ])
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Voucher & Promo</Text>
      <Text style={styles.subtitle}>{vouchers.filter((v) => v.active).length} aktif dari {vouchers.length} voucher</Text>

      <Button title="+ Buat Voucher" icon="add-circle-outline" onPress={() => openForm()} />

      <FlatList
        data={vouchers}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada voucher" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Badge label={item.active ? 'Aktif' : 'Nonaktif'} variant={item.active ? 'success' : 'warning'} />
                </View>
                <Text style={styles.nama}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.type === 'percentage' ? `Diskon ${item.value}%` : `Potongan ${formatRupiah(item.value)}`}
                  {item.minPurchase > 0 && ` • Min. ${formatRupiah(item.minPurchase)}`}
                </Text>
                {(item.startDate || item.endDate) && (
                  <Text style={styles.meta}>{item.startDate && formatDate(item.startDate)} — {item.endDate && formatDate(item.endDate)}</Text>
                )}
                <Text style={styles.meta}>Terpakai: {item.usedCount}{item.usageLimit > 0 ? ` / ${item.usageLimit}` : ''}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => toggleActive(item)}>
                <Ionicons name={item.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fonts.small }}>{item.active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                <Ionicons name="create-outline" size={16} color={colors.info} />
                <Text style={{ color: colors.info, fontWeight: '700', fontSize: fonts.small }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteVoucher(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{editing ? 'Edit Voucher' : 'Buat Voucher'}</Text>
            <Input label="Kode *" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" placeholder="HEMAT10" />
            <Input label="Nama Promo *" value={name} onChangeText={setName} />
            <Segmented
              options={[{ label: 'Persen (%)', value: 'percentage' }, { label: 'Nominal (Rp)', value: 'fixed' }]}
              value={type}
              onChange={setType}
            />
            <Input label={type === 'percentage' ? 'Nilai Diskon (%) *' : 'Nilai Potongan (Rp) *'} value={value} onChangeText={setValue} keyboardType="numeric" />
            <Input label="Minimum Pembelian (Rp)" value={minPurchase} onChangeText={setMinPurchase} keyboardType="numeric" />
            <Input label="Batas Pemakaian (0 = tak terbatas)" value={usageLimit} onChangeText={setUsageLimit} keyboardType="numeric" />
            <Input label="Mulai (yyyy-mm-dd)" value={startDate} onChangeText={setStartDate} />
            <Input label="Berakhir (yyyy-mm-dd)" value={endDate} onChangeText={setEndDate} />
            <Input label="Deskripsi" value={description} onChangeText={setDescription} multiline />
            <View style={styles.switchRow}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Aktif</Text>
              <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.primary }} />
            </View>
            <Button title="Simpan" variant="success" icon="save-outline" onPress={handleSubmit} />
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
  rowTop: { flexDirection: 'row' },
  code: { fontSize: fonts.h3, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text, marginTop: 2 },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
