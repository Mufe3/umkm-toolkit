// Konversi native dari src/components/DebtManagement.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState, StatCard } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId, todayISO } from '../utils/storage'

interface Debt {
  id: string
  type: 'receivable' | 'payable'
  partyName: string
  invoiceNumber?: string
  amount: number
  paidAmount: number
  dueDate: string
  date: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  notes: string
}

const statusBadge: Record<Debt['status'], { label: string; variant: 'danger' | 'warning' | 'success' | 'info' }> = {
  pending: { label: 'Belum Bayar', variant: 'danger' },
  partial: { label: 'Dibayar Sebagian', variant: 'warning' },
  paid: { label: 'Lunas', variant: 'success' },
  overdue: { label: 'Terlambat', variant: 'info' },
}

export default function DebtScreen() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'receivable' | 'payable'>('all')

  const [type, setType] = useState<'receivable' | 'payable'>('receivable')
  const [partyName, setPartyName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // dialog input pembayaran (RN tidak punya Alert.prompt di Android)
  const [payTarget, setPayTarget] = useState<Debt | null>(null)
  const [payValue, setPayValue] = useState('')

  const persist = (updated: Debt[]) => {
    setDebts(updated)
    saveItem('umkm_debts', updated)
  }

  useEffect(() => {
    loadItem<Debt[]>('umkm_debts', []).then((list) => {
      // tandai jatuh tempo otomatis seperti versi web
      const now = new Date()
      persist(list.map((d) => d.status !== 'paid' && d.dueDate && new Date(d.dueDate) < now ? { ...d, status: 'overdue' as const } : d))
    })
  }, [])

  const resetForm = () => {
    setPartyName(''); setInvoiceNumber(''); setAmount(''); setDueDate(''); setNotes(''); setShowForm(false)
  }

  const handleSubmit = () => {
    const amt = Number(amount)
    if (!partyName || !amt) { Alert.alert('Perhatian', 'Nama pihak & jumlah wajib diisi!'); return }
    const d: Debt = {
      id: generateId(), type, partyName, invoiceNumber, amount: amt, paidAmount: 0,
      dueDate, date: new Date().toISOString(), status: 'pending', notes,
    }
    persist([d, ...debts])
    resetForm()
  }

  const recordPayment = (debt: Debt) => {
    setPayValue('')
    setPayTarget(debt)
  }

  const submitPayment = () => {
    if (!payTarget) return
    const pay = Number(payValue)
    if (!pay) { Alert.alert('Perhatian', 'Masukkan jumlah pembayaran!'); return }
    const paid = Math.min(payTarget.paidAmount + pay, payTarget.amount)
    persist(debts.map((d) => d.id === payTarget.id ? { ...d, paidAmount: paid, status: paid >= d.amount ? 'paid' as const : 'partial' as const } : d))
    setPayTarget(null)
  }

  const deleteDebt = (id: string) => {
    Alert.alert('Hapus catatan ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(debts.filter((d) => d.id !== id)) },
    ])
  }

  const list = filter === 'all' ? debts : debts.filter((d) => d.type === filter)
  const totalReceivable = debts.filter((d) => d.type === 'receivable').reduce((s, d) => s + (d.amount - d.paidAmount), 0)
  const totalPayable = debts.filter((d) => d.type === 'payable').reduce((s, d) => s + (d.amount - d.paidAmount), 0)

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Utang & Piutang</Text>
      <Text style={styles.subtitle}>Pantau tagihan dan kewajiban</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard title="Piutang" value={formatRupiah(totalReceivable)} icon="arrow-up-outline" color={colors.info} />
        <StatCard title="Utang" value={formatRupiah(totalPayable)} icon="arrow-down-outline" color={colors.warning} />
      </View>

      <Segmented
        options={[{ label: 'Semua', value: 'all' }, { label: 'Piutang', value: 'receivable' }, { label: 'Utang', value: 'payable' }]}
        value={filter}
        onChange={setFilter}
      />

      <Button title="+ Tambah Catatan" icon="add-circle-outline" onPress={() => setShowForm(true)} />

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada utang/piutang" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.party}>{item.type === 'receivable' ? '📥 ' : '📤 '}{item.partyName}</Text>
                {!!item.invoiceNumber && <Text style={styles.meta}>Inv: {item.invoiceNumber}</Text>}
                <Text style={styles.meta}>Jatuh tempo: {item.dueDate ? formatDate(item.dueDate) : '-'}</Text>
              </View>
              <Badge label={statusBadge[item.status].label} variant={statusBadge[item.status].variant} />
            </View>
            <Text style={styles.amountLine}>
              {formatRupiah(item.paidAmount)} / {formatRupiah(item.amount)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min((item.paidAmount / item.amount) * 100, 100)}%` }]} />
            </View>
            <View style={styles.actions}>
              {item.status !== 'paid' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => recordPayment(item)}>
                  <Ionicons name="cash-outline" size={16} color={colors.success} />
                  <Text style={{ color: colors.success, fontWeight: '700', fontSize: fonts.small }}>Bayar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteDebt(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      {/* Dialog input pembayaran */}
      <Modal visible={payTarget !== null} transparent animationType="fade" onRequestClose={() => setPayTarget(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.dialogWrap}>
          <View style={styles.dialog}>
            <Text style={styles.sheetTitle}>Catat Pembayaran</Text>
            {payTarget && (
              <Text style={{ color: colors.textMuted, marginBottom: spacing.md }}>
                Sisa: {formatRupiah(payTarget.amount - payTarget.paidAmount)}
              </Text>
            )}
            <Input label="Jumlah Bayar (Rp)" value={payValue} onChangeText={setPayValue} keyboardType="numeric" />
            <Button title="Konfirmasi" variant="success" icon="checkmark-circle-outline" onPress={submitPayment} />
            <Button title="Batal" variant="outline" onPress={() => setPayTarget(null)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Tambah Utang / Piutang</Text>
            <Segmented
              options={[{ label: 'Piutang', value: 'receivable' }, { label: 'Utang', value: 'payable' }]}
              value={type}
              onChange={setType}
            />
            <Input label="Nama Pihak" value={partyName} onChangeText={setPartyName} placeholder="nama customer/supplier" />
            <Input label="No. Invoice (opsional)" value={invoiceNumber} onChangeText={setInvoiceNumber} />
            <Input label="Jumlah (Rp)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Input label="Jatuh Tempo (yyyy-mm-dd)" value={dueDate} onChangeText={setDueDate} placeholder={todayISO()} />
            <Input label="Catatan" value={notes} onChangeText={setNotes} multiline />
            <Button title="Simpan" variant="success" icon="save-outline" onPress={handleSubmit} />
            <Button title="Batal" variant="outline" onPress={resetForm} />
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
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  party: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  amountLine: { fontSize: fonts.small, color: colors.text, marginBottom: 4, fontWeight: '600' },
  barTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  barFill: { height: 6, borderRadius: radius.full, backgroundColor: colors.success },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  dialogWrap: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: spacing.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
