// Konversi native dari src/components/EmployeeManagement.tsx (web)

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Badge, Input, Segmented, EmptyState } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah, formatDate, generateId, todayISO } from '../utils/storage'

interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  joinDate: string
  salary: number
  commissionRate: number
  status: 'active' | 'inactive'
}

type Tab = 'employees' | 'attendance' | 'commission'

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tab, setTab] = useState<Tab>('employees')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [salary, setSalary] = useState('')
  const [commissionRate, setCommissionRate] = useState('')

  const persist = (updated: Employee[]) => {
    setEmployees(updated)
    saveItem('umkm_employees', updated)
  }

  useEffect(() => {
    loadItem<Employee[]>('umkm_employees', []).then(setEmployees)
  }, [])

  const openForm = (e?: Employee) => {
    if (e) {
      setEditing(e); setName(e.name); setPosition(e.position); setPhone(e.phone)
      setEmail(e.email); setSalary(String(e.salary)); setCommissionRate(String(e.commissionRate))
    } else {
      setEditing(null); setName(''); setPosition(''); setPhone(''); setEmail(''); setSalary(''); setCommissionRate('')
    }
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!name || !position) { Alert.alert('Perhatian', 'Nama dan posisi wajib diisi!'); return }
    const base = {
      name, position, phone, email,
      salary: Number(salary) || 0, commissionRate: Number(commissionRate) || 0,
    }
    if (editing) {
      persist(employees.map((e) => (e.id === editing.id ? { ...e, ...base } : e)))
    } else {
      persist([{ id: generateId(), joinDate: new Date().toISOString(), status: 'active', ...base }, ...employees])
    }
    setShowForm(false)
  }

  const toggleStatus = (e: Employee) =>
    persist(employees.map((x) => (x.id === e.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x)))

  const deleteEmployee = (id: string) => {
    Alert.alert('Hapus karyawan ini?', '', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => persist(employees.filter((e) => e.id !== id)) },
    ])
  }

  const activeCount = employees.filter((e) => e.status === 'active').length
  const totalPayroll = employees.filter((e) => e.status === 'active').reduce((s, e) => s + e.salary, 0)

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Karyawan</Text>
      <Text style={styles.subtitle}>{activeCount} aktif • Gaji bulanan {formatRupiah(totalPayroll)}</Text>

      <Segmented
        options={[
          { label: 'Data Karyawan', value: 'employees' },
          { label: 'Absensi', value: 'attendance' },
          { label: 'Komisi', value: 'commission' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'employees' && (
        <>
          <Button title="+ Tambah Karyawan" icon="add-circle-outline" onPress={() => openForm()} />
          <FlatList
            data={employees}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<EmptyState text="Belum ada karyawan" />}
            renderItem={({ item }) => (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.avatar}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: fonts.h3 }}>
                      {item.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nama}>{item.name}</Text>
                    <Text style={styles.meta}>{item.position} • {item.phone}</Text>
                    <Text style={styles.meta}>Gaji {formatRupiah(item.salary)}{item.commissionRate > 0 ? ` + komisi ${item.commissionRate}%` : ''}</Text>
                  </View>
                  <Badge label={item.status === 'active' ? 'Aktif' : 'Nonaktif'} variant={item.status === 'active' ? 'success' : 'warning'} />
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fonts.small }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => toggleStatus(item)}>
                    <Ionicons name={item.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={colors.warning} />
                    <Text style={{ color: colors.warning, fontWeight: '700', fontSize: fonts.small }}>{item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => deleteEmployee(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          />
        </>
      )}

      {tab === 'attendance' && (
        <Card>
          <Text style={styles.nama}>Absensi Harian ({formatDate(todayISO())})</Text>
          {employees.filter((e) => e.status === 'active').map((e) => (
            <View key={e.id} style={styles.attRow}>
              <Text style={{ flex: 1, color: colors.text }}>{e.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.attChip, { backgroundColor: colors.successLight }]}><Text style={{ color: colors.success, fontWeight: '700', fontSize: fonts.small }}>Hadir</Text></View>
                <View style={[styles.attChip, { backgroundColor: colors.warningLight }]}><Text style={{ color: colors.warning, fontWeight: '700', fontSize: fonts.small }}>Telat</Text></View>
                <View style={[styles.attChip, { backgroundColor: colors.dangerLight }]}><Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>Alpha</Text></View>
              </View>
            </View>
          ))}
          {employees.length === 0 && <EmptyState text="Tambahkan karyawan dulu" />}
          <Text style={styles.meta}>Catatan: penyimpanan absensi otomatis menyusul — versi web memakai kunci umkm_attendance.</Text>
        </Card>
      )}

      {tab === 'commission' && (
        <Card>
          <Text style={styles.nama}>Rekap Komisi</Text>
          {employees.filter((e) => e.commissionRate > 0).map((e) => (
            <View key={e.id} style={styles.attRow}>
              <Text style={{ flex: 1, color: colors.text }}>{e.name}</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{e.commissionRate}%</Text>
            </View>
          ))}
          {employees.every((e) => !e.commissionRate) && <EmptyState text="Belum ada karyawan dengan komisi" />}
        </Card>
      )}

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</Text>
            <Input label="Nama *" value={name} onChangeText={setName} />
            <Input label="Posisi *" value={position} onChangeText={setPosition} placeholder="cth: Kasir" />
            <Input label="Telepon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Gaji Pokok (Rp)" value={salary} onChangeText={setSalary} keyboardType="numeric" />
            <Input label="Persentase Komisi (%)" value={commissionRate} onChangeText={setCommissionRate} keyboardType="numeric" />
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
  avatar: { width: 46, height: 46, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nama: { fontSize: fonts.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  attChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: '85%' },
  sheetTitle: { fontSize: fonts.h2, fontWeight: '800', marginBottom: spacing.md, color: colors.text },
})
