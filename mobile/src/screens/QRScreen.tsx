// Konversi native dari src/components/QRCodeGenerator.tsx (web)
// qrcode.react → react-native-qrcode-svg (render QR asli, setara web).

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
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
          {payload.trim() ? (
            <View style={styles.qrWhite}>
              <QRCode value={payload} size={180} color={colors.text} backgroundColor="#ffffff" />
            </View>
          ) : (
            <Text style={styles.payloadLabel}>Isi data untuk menampilkan QR</Text>
          )}
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
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  qrBox: { alignItems: 'center', paddingVertical: spacing.lg, width: '100%' },
  qrWhite: { backgroundColor: '#ffffff', padding: spacing.md, borderRadius: radius.md, alignSelf: 'center' },
  payloadLabel: { marginTop: spacing.md, fontSize: fonts.small, color: colors.textMuted },
  payload: { marginTop: 4, fontSize: fonts.small, color: colors.text, fontWeight: '600', textAlign: 'center' },
})
