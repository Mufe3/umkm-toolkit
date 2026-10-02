// CustomersScreen — konversi native dari src/components/CustomerManagement.tsx

import React, { useEffect, useState } from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import { Card, Badge, Button, Input, EmptyState } from '../components/UI'
import { colors, spacing, fonts } from '../theme'
import { loadItem, saveItem } from '../utils/storage'
import type { Pelanggan } from '../utils/storage'

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Pelanggan[]>([])
  const [nama, setNama] = useState('')
  const [telepon, setTelepon] = useState('')
  const [alamat, setAlamat] = useState('')

  useEffect(() => {
    loadItem<Pelanggan[]>('customers', []).then(setCustomers)
  }, [])

  const tambah = async () => {
    if (!nama.trim()) return
    const next = [...customers, {
      id: Date.now().toString(),
      nama: nama.trim(),
      telepon: telepon.trim(),
      alamat: alamat.trim(),
      poin: 0,
    }]
    setCustomers(next)
    await saveItem('customers', next)
    setNama(''); setTelepon(''); setAlamat('')
  }

  return (
    <FlatList
      style={styles.screen}
      data={customers}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Pelanggan</Text>
          <Card>
            <Input label="Nama" value={nama} onChangeText={setNama} placeholder="Nama pelanggan" />
            <Input label="Telepon" value={telepon} onChangeText={setTelepon} keyboardType="phone-pad" placeholder="08xxx" />
            <Input label="Alamat" value={alamat} onChangeText={setAlamat} placeholder="Alamat lengkap" />
            <Button title="+ Tambah Pelanggan" icon="person-add-outline" onPress={tambah} />
          </Card>
        </>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nama}>{item.nama}</Text>
              <Text style={styles.meta}>{item.telepon || '-'} • {item.alamat || '-'}</Text>
            </View>
            <Badge label={`${item.poin} poin`} variant="info" />
          </View>
        </Card>
      )}
      ListEmptyComponent={<EmptyState text="Belum ada pelanggan" />}
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  nama: { fontSize: fonts.h3, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.small, color: colors.textMuted, marginTop: 2 },
})
