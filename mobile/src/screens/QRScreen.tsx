// Konversi native dari src/components/QRCodeGenerator.tsx (web)
// qrcode.react + download PNG diganti: tampilkan teks/URL + tombol salin & buka.

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Button, Input, Segmented } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import * as Clipboard from 'expo-clipboard'

type Mode = 'link' | 'text' | 'wifi'

export default function QRScreen() {
  const [mode, setMode] = useState<Mode>('link')
  const [link, setLink] = useState('https://')
  const [text, setText] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')

  const payload =
    mode === 'link' ? link :
    mode === 'text' ? text :
    `WIFI:T:WPA;S:${ssid};P:${password};;`

  const copy = async () => {
    await Clipboard.setStringAsync(payload)
    Alert.alert('Tersalin 📋', 'Isi QR siap dibagikan / ditempel di generator QR lain.')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>QR Code</Text>
      <Text style={styles.subtitle}>Buat data untuk QR code usaha Anda</Text>

      <Segmented
        options={[{ label: 'Link', value: 'link' }, { label: 'Teks', value: 'text' }, { label: 'WiFi', value: 'wifi' }]}
        value={mode}
        onChange={setMode}
      />

      <Card>
        {mode === 'link' && <Input label="URL Toko / Menu" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" />}
        {mode === 'text' && <Input label="Teks" value={text} onChangeText={setText} multiline placeholder="isi pesan QR" />}
        {mode === 'wifi' && (
          <>
            <Input label="Nama Jaringan (SSID)" value={ssid} onChangeText={setSsid} />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          </>
        )}
      </Card>

      <Card style={{ alignItems: 'center' }}>
        <View style={styles.qrBox}>
          <Ionicons name="qr-code-outline" size={72} color={colors.primary} />
          <Text style={styles.payloadLabel}>Isi QR:</Text>
          <Text style={styles.payload} selectable>{payload || '—'}</Text>
        </View>
        <Button title="Salin Isi QR" icon="copy-outline" onPress={copy} disabled={!payload.trim()} />
        {mode === 'link' && !!link && link !== 'https://' && (
          <Button
            title="Buka Link"
            variant="outline"
            icon="open-outline"
            onPress={() => Linking.openURL(link).catch(() => Alert.alert('Gagal', 'Tidak bisa membuka link.'))}
          />
        )}
        <Text style={styles.hint}>
          Versi web menampilkan gambar QR langsung. Di mobile, salin isi ini ke aplikasi QR generator, atau fitur render QR native menyusul.
        </Text>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  qrBox: { alignItems: 'center', paddingVertical: spacing.lg },
  payloadLabel: { marginTop: spacing.md, fontSize: fonts.small, color: colors.textMuted },
  payload: { marginTop: 4, fontSize: fonts.small, color: colors.text, fontWeight: '600', textAlign: 'center' },
  hint: { marginTop: spacing.md, fontSize: fonts.tiny, color: colors.textMuted, textAlign: 'center' },
})
