// Konversi native dari src/components/SupplierManagement.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, generateId } from '../utils/storage'

interface Supplier {
  id: string
  name: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  notes: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [rating, setRating] = useState(5)
  const [notes, setNotes] = useState('')

  const persist = (updated: Supplier[]) => {
    setSuppliers(updated)
    saveItem('umkm_suppliers', updated)
  }

  useEffect(() => {
    loadItem<Supplier[]>('umkm_suppliers', []).then(setSuppliers)
  }, [])

  const openForm = (s?: Supplier) => {
    if (s) {
      setEditing(s); setName(s.name); setPhone(s.phone); setEmail(s.email)
      setAddress(s.address); setCategory(s.category); setRating(s.rating); setNotes(s.notes)
    } else {
      setEditing(null); setName(''); setPhone(''); setEmail(''); setAddress(''); setCategory(''); setRating(5); setNotes('')
    }
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!name || !phone) { Alert.alert('Perhatian', 'Nama & telepon wajib diisi!'); return }
    if (editing) {
      persist(suppliers.map((s) => s.id === editing.id ? { ...s, name, phone, email, address, category, rating, notes } : s))
    } else {
      const s: Supplier = {
        id: generateId(), name, phone, email, address, category, rating, notes,
        totalOrders: 0, totalSpent: 0, createdAt: new Date().toISOString(),
      }
      persist([s, ...suppliers])
    }
    setShowForm(false)
  }

  const deleteSupplier = (id: string) => {
    Alert.alert('Hapus supplier ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(suppliers.filter((s) => s.id !== id)) },
    ])
  }

  const list = suppliers.filter((s) =>
    (s.name + s.category + s.phone).toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Supplier</Text>
      <Text style={styles.subtitle}>{suppliers.length} pemasok terdaftar</Text>

      <Input
        placeholder="Cari nama / kategori..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <Button title="+ Tambah Supplier" icon="add-circle-outline" onPress={() => openForm()} />

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<EmptyState text="Belum ada supplier" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nama}>{item.name}</Text>
                <Text style={styles.meta}>{item.category || 'Umum'} • {item.phone}</Text>
                {!!item.address && <Text style={styles.meta}>{item.address}</Text>}
              </View>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons key={n} name={n <= item.rating ? 'star' : 'star-outline'} size={14} color={colors.warning} />
                ))}
              </View>
            </View>
            <View style={styles.statsLine}>
              <Text style={styles.statTxt}>{item.totalOrders} pesanan</Text>
              <Text style={styles.statTxt}>Total {formatRupiah(item.totalSpent)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fonts.small }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteSupplier(item.id)}>
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
            <Text style={styles.sheetTitle}>{editing ? 'Edit Supplier' : 'Tambah Supplier'}</Text>
            <Input label="Nama *" value={name} onChangeText={setName} />
            <Input label="Telepon *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Alamat" value={address} onChangeText={setAddress} multiline />
            <Input label="Kategori" value={category} onChangeText={setCategory} placeholder="cth: Bahan Baku" />
            <Text style={styles.labelSmall}>Rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={colors.warning} />
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Catatan" value={notes} onChangeText={setNotes} multiline />
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
  rowTop: { flexDirection: 'row', alignItems: 'flex-start' },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  starRow: { flexDirection: 'row', gap: 2, marginTop: spacing.md },
  statsLine: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  statTxt: { fontSize: fonts.tiny, color: colors.textMuted, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelSmall: { fontSize: fonts.small, fontWeight: '600', color: colors.text, marginBottom: 6 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
