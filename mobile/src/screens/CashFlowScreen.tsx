// Konversi native dari src/components/CashFlowTracker.tsx (web)
// - alert()/confirm()  → Alert.alert() RN
// - diagram batang     → View dengan width proporsional (tanpa recharts/xlsx)
// - export Excel/JSON  → dihapus (khas web), diganti ringkasan kategori

import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState, StatCard } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId, todayISO } from '../utils/storage'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

const incomeCategories = ['Penjualan Produk', 'Penjualan Jasa', 'Komisi', 'Investasi', 'Lainnya']
const expenseCategories = ['Bahan Baku', 'Gaji Karyawan', 'Sewa', 'Listrik/Air', 'Transportasi', 'Marketing', 'Pajak', 'Lainnya']

type Filter = 'all' | 'income' | 'expense'
type Period = 'week' | 'month' | 'all'

export default function CashFlowScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [period, setPeriod] = useState<Period>('month')

  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())

  const persist = (updated: Transaction[]) => {
    setTransactions(updated)
    saveItem('umkm_transactions', updated)
  }

  useEffect(() => {
    loadItem<Transaction[]>('umkm_transactions', []).then(setTransactions)
  }, [])

  const resetForm = () => {
    setAmount(''); setCategory(''); setDescription(''); setDate(todayISO()); setShowForm(false)
  }

  const handleSubmit = () => {
    const amt = Number(amount)
    if (!amt || !category || !description) {
      Alert.alert('Perhatian', 'Lengkapi semua data!')
      return
    }
    const t: Transaction = { id: generateId(), type, amount: amt, category, description, date: new Date(date).toISOString() }
    persist([t, ...transactions])
    resetForm()
  }

  const deleteTransaction = (id: string) => {
    Alert.alert('Hapus transaksi ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(transactions.filter((t) => t.id !== id)) },
    ])
  }

  const filteredByPeriod = transactions.filter((t) => {
    const d = new Date(t.date); const now = new Date()
    if (period === 'week') return d >= new Date(now.getTime() - 7 * 864e5)
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })
  const list = filter === 'all' ? filteredByPeriod : filteredByPeriod.filter((t) => t.type === filter)

  const totalIncome = filteredByPeriod.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filteredByPeriod.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const breakdown = filteredByPeriod
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})
  const maxCat = Math.max(...Object.values(breakdown), 1)

  const cats = type === 'income' ? incomeCategories : expenseCategories

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Cash Flow</Text>
      <Text style={styles.subtitle}>Pencatatan pemasukan & pengeluaran</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard title="Masuk" value={formatRupiah(totalIncome)} icon="arrow-down-circle-outline" color={colors.success} />
        <StatCard title="Keluar" value={formatRupiah(totalExpense)} icon="arrow-up-circle-outline" color={colors.danger} />
      </View>
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.muted}>Saldo Bersih</Text>
        <Text style={[styles.balance, { color: balance >= 0 ? colors.success : colors.danger }]}>{formatRupiah(balance)}</Text>
      </Card>

      <Segmented
        options={[{ label: 'Minggu Ini', value: 'week' }, { label: 'Bulan Ini', value: 'month' }, { label: 'Semua', value: 'all' }]}
        value={period}
        onChange={setPeriod}
      />
      <Segmented
        options={[{ label: 'Semua', value: 'all' }, { label: 'Masuk', value: 'income' }, { label: 'Keluar', value: 'expense' }]}
        value={filter}
        onChange={setFilter}
      />

      {Object.keys(breakdown).length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Pengeluaran per Kategori</Text>
          {Object.entries(breakdown).map(([cat, val]) => (
            <View key={cat} style={{ marginBottom: spacing.sm }}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>{cat}</Text>
                <Text style={styles.barValue}>{formatRupiah(val)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(val / maxCat) * 100}%` }]} />
              </View>
            </View>
          ))}
        </Card>
      )}

      <Button title="+ Catat Transaksi" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada transaksi" />}
        renderItem={({ item }) => (
          <Card style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? colors.successLight : colors.dangerLight }]}>
              <Ionicons name={item.type === 'income' ? 'trending-up' : 'trending-down'} size={20} color={item.type === 'income' ? colors.success : colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{item.description}</Text>
              <Text style={styles.txMeta}>{item.category} • {formatDate(item.date)}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
              {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
            </Text>
            <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Catat Transaksi</Text>
            <Segmented
              options={[{ label: 'Pemasukan', value: 'income' }, { label: 'Pengeluaran', value: 'expense' }]}
              value={type}
              onChange={(v) => { setType(v); setCategory('') }}
            />
            <Input label="Jumlah (Rp)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
            <Text style={styles.labelSmall}>Kategori</Text>
            <View style={styles.catWrap}>
              {cats.map((c) => (
                <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
                  <Text style={{ color: category === c ? colors.white : colors.textMuted, fontSize: fonts.small }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Keterangan" value={description} onChangeText={setDescription} placeholder="cth: penjualan harian" />
            <Input label="Tanggal (yyyy-mm-dd)" value={date} onChangeText={setDate} placeholder={todayISO()} />
            <Button title="Simpan" variant="success" icon="save-outline" onPress={handleSubmit} />
            <Button title="Batal" variant="outline" onPress={resetForm} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, fontSize: fonts.small },
  balance: { fontSize: fonts.h1, fontWeight: '800' },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: fonts.small, color: colors.text },
  barValue: { fontSize: fonts.small, color: colors.textMuted },
  barTrack: { height: 8, borderRadius: radius.full, backgroundColor: colors.border, marginTop: 4 },
  barFill: { height: 8, borderRadius: radius.full, backgroundColor: colors.danger },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: fonts.body, fontWeight: '600', color: colors.text },
  txMeta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: fonts.small, fontWeight: '800' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
})
