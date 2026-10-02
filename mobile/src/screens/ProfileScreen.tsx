// Konversi native dari src/components/BusinessProfile.tsx (web)
// Profil usaha + pengaturan toko (kunci umkm_store_settings sama dengan versi web).

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { Card, Button, Input } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { loadItem, saveItem, formatRupiah } from '../utils/storage'

interface StoreSettings {
  storeName: string
  storeAddress: string
  storePhone: string
}

export default function ProfileScreen() {
  const [store, setStore] = useState<StoreSettings>({ storeName: 'Toko Saya', storeAddress: '', storePhone: '' })
  const [namaUsaha, setNamaUsaha] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState('')
  const [omzet, setOmzet] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    loadItem<StoreSettings>('umkm_store_settings', store).then(setStore)
    loadItem<any>('umkm_business_profile', {}).then((p) => {
      if (p?.namaUsaha) { setNamaUsaha(p.namaUsaha); setDeskripsi(p.deskripsi || ''); setKategori(p.kategori || ''); setOmzet(String(p.omzetTarget || '')); setSavedAt(p.updatedAt || '') }
    })
  }, [])

  const saveStore = () => saveItem('umkm_store_settings', store)

  const saveProfile = () => {
    if (!namaUsaha) { Alert.alert('Perhatian', 'Isi nama usaha dulu!'); return }
    saveItem('umkm_business_profile', {
      namaUsaha, deskripsi, kategori, omzetTarget: Number(omzet) || 0, updatedAt: new Date().toISOString(),
    })
    setSavedAt(new Date().toISOString())
    Alert.alert('Tersimpan ✅', 'Profil usaha tersimpan di perangkat.')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Profil Usaha</Text>
      <Text style={styles.subtitle}>Identitas toko untuk struk & invoice</Text>

      <Card>
        <Text style={styles.cardTitle}>Pengaturan Toko (dipakai Struk)</Text>
        <Input label="Nama Toko" value={store.storeName} onChangeText={(v) => setStore({ ...store, storeName: v })} />
        <Input label="Telepon" value={store.storePhone} onChangeText={(v) => setStore({ ...store, storePhone: v })} keyboardType="phone-pad" />
        <Input label="Alamat" value={store.storeAddress} onChangeText={(v) => setStore({ ...store, storeAddress: v })} multiline />
        <Button title="Simpan Toko" icon="save-outline" onPress={() => { saveStore(); Alert.alert('Tersimpan ✅', 'Pengaturan toko disimpan.') }} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Profil Bisnis</Text>
        <Input label="Nama Usaha" value={namaUsaha} onChangeText={setNamaUsaha} placeholder="cth: Kopi Susu Tetangga" />
        <Input label="Kategori" value={kategori} onChangeText={setKategori} placeholder="cth: F&B" />
        <Input label="Deskripsi" value={deskripsi} onChangeText={setDeskripsi} multiline />
        <Input label="Target Omzet Bulanan (Rp)" value={omzet} onChangeText={setOmzet} keyboardType="numeric" />
        {!!Number(omzet) && <Text style={styles.meta}>Target: {formatRupiah(Number(omzet))}</Text>}
        <Button title="Simpan Profil" variant="success" icon="save-outline" onPress={saveProfile} />
        {!!savedAt && <Text style={styles.meta}>Terakhir disimpan: {new Date(savedAt).toLocaleString('id-ID')}</Text>}
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  cardTitle: { fontSize: fonts.h3, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  meta: { fontSize: fonts.tiny, color: colors.textMuted, marginTop: 6 },
})
