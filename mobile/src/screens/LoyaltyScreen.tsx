// Konversi native dari src/components/LoyaltyProgram.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState, StatCard } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId } from '../utils/storage'

interface LoyaltyMember {
  id: string
  name: string
  phone: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  joinDate: string
  totalSpent: number
}

interface PointTransaction {
  id: string
  memberId: string
  type: 'earn' | 'redeem'
  points: number
  description: string
  date: string
}

const tierColor: Record<LoyaltyMember['tier'], string> = {
  bronze: '#b45309', silver: '#64748b', gold: '#ca8a04', platinum: '#7c3aed',
}

function calculateTier(totalSpent: number): LoyaltyMember['tier'] {
  if (totalSpent >= 10000000) return 'platinum'
  if (totalSpent >= 5000000) return 'gold'
  if (totalSpent >= 2000000) return 'silver'
  return 'bronze'
}

export default function LoyaltyScreen() {
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [txs, setTxs] = useState<PointTransaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPointsForm, setShowPointsForm] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [pointType, setPointType] = useState<'earn' | 'redeem'>('earn')
  const [points, setPoints] = useState('')
  const [description, setDescription] = useState('')

  const persistMembers = (updated: LoyaltyMember[]) => {
    setMembers(updated)
    saveItem('umkm_loyalty_members', updated)
  }
  const persistTxs = (updated: PointTransaction[]) => {
    setTxs(updated)
    saveItem('umkm_point_transactions', updated)
  }

  useEffect(() => {
    loadItem<LoyaltyMember[]>('umkm_loyalty_members', []).then(setMembers)
    loadItem<PointTransaction[]>('umkm_point_transactions', []).then(setTxs)
  }, [])

  const addMember = () => {
    if (!name || !phone) { Alert.alert('Perhatian', 'Nama & telepon wajib diisi!'); return }
    persistMembers([
      { id: generateId(), name, phone, points: 0, tier: 'bronze', joinDate: new Date().toISOString(), totalSpent: 0 },
      ...members,
    ])
    setName(''); setPhone(''); setShowForm(false)
  }

  const addPoints = () => {
    const pts = Number(points)
    if (!selectedMember || !pts) { Alert.alert('Perhatian', 'Pilih member & jumlah poin!'); return }
    const tx: PointTransaction = {
      id: generateId(), memberId: selectedMember, type: pointType, points: pts,
      description: description || (pointType === 'earn' ? 'Penambahan poin' : 'Penukaran poin'),
      date: new Date().toISOString(),
    }
    persistTxs([tx, ...txs])
    persistMembers(members.map((m) => {
      if (m.id !== selectedMember) return m
      const newPoints = pointType === 'earn' ? m.points + pts : Math.max(m.points - pts, 0)
      const newSpent = pointType === 'earn' ? m.totalSpent + pts * 10000 : m.totalSpent
      return { ...m, points: newPoints, totalSpent: newSpent, tier: calculateTier(newSpent) }
    }))
    setPoints(''); setDescription(''); setSelectedMember(''); setShowPointsForm(false)
  }

  const totalPoints = members.reduce((s, m) => s + m.points, 0)

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Loyalty Program</Text>
      <Text style={styles.subtitle}>{members.length} member • {totalPoints.toLocaleString('id-ID')} poin beredar</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button title="+ Member" icon="person-add-outline" onPress={() => setShowForm(true)} />
        <View style={{ width: spacing.sm }} />
        <Button title="± Poin" variant="success" icon="star-outline" onPress={() => setShowPointsForm(true)} />
      </View>

      <FlatList
        data={members}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada member loyalitas" />}
        renderItem={({ item }) => (
          <Card style={styles.memberRow}>
            <View style={[styles.avatar, { backgroundColor: tierColor[item.tier] + '22' }]}>
              <Text style={{ color: tierColor[item.tier], fontWeight: '900', fontSize: fonts.h3 }}>
                {item.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{item.name}</Text>
              <Text style={styles.meta}>{item.phone} • sejak {formatDate(item.joinDate)}</Text>
              <Text style={styles.meta}>Total belanja: {formatRupiah(item.totalSpent)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Badge label={item.tier.toUpperCase()} variant="primary" />
              <Text style={[styles.pts, { color: tierColor[item.tier] }]}>{item.points} ⭐</Text>
            </View>
          </Card>
        )}
      />

      {/* Form member */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tambah Member</Text>
            <Input label="Nama *" value={name} onChangeText={setName} />
            <Input label="Telepon *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title="Simpan" variant="success" icon="save-outline" onPress={addMember} />
            <Button title="Batal" variant="outline" onPress={() => setShowForm(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Form poin */}
      <Modal visible={showPointsForm} transparent animationType="slide" onRequestClose={() => setShowPointsForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Kelola Poin</Text>
            <Segmented
              options={[{ label: 'Tambah Poin', value: 'earn' }, { label: 'Tukar Poin', value: 'redeem' }]}
              value={pointType}
              onChange={setPointType}
            />
            <Text style={styles.labelSmall}>Pilih Member</Text>
            <View style={styles.memberPicker}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, selectedMember === m.id && styles.chipActive]}
                  onPress={() => setSelectedMember(m.id)}
                >
                  <Text style={{ color: selectedMember === m.id ? colors.white : colors.textMuted, fontSize: fonts.small }}>
                    {m.name} ({m.points})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Jumlah Poin *" value={points} onChangeText={setPoints} keyboardType="numeric" />
            <Input label="Keterangan" value={description} onChangeText={setDescription} placeholder="cth: pembelian tanggal ..." />
            <Button title="Simpan" variant="success" icon="save-outline" onPress={addPoints} />
            <Button title="Batal" variant="outline" onPress={() => setShowPointsForm(false)} />
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
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  pts: { fontSize: fonts.h3, fontWeight: '900' },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  memberPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
