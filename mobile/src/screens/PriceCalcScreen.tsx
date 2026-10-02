// Konversi native dari src/components/PriceCalculator.tsx (web)
// Kalkulator margin harga jual — murni state, tanpa storage.

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Card, Input, Segmented, Button } from '../components/UI'
import { colors, spacing, fonts, radius } from '../theme'
import { formatRupiah } from '../utils/storage'

type Mode = 'margin' | 'markup' | 'diskon'

export default function PriceCalcScreen() {
  const [mode, setMode] = useState<Mode>('margin')
  const [modal, setModal] = useState('')   // modalitas
  const [biaya, setBiaya] = useState('')   // HPP
  const [persen, setPersen] = useState('')

  const m = Number(modal) || 0
  const b = Number(biaya) || 0
  const p = Number(persen) || 0

  let hasil = 0
  let laba = 0
  if (mode === 'margin') {
    hasil = p >= 100 ? 0 : b / (1 - p / 100)
    laba = hasil - b
  } else if (mode === 'markup') {
    hasil = b * (1 + p / 100)
    laba = hasil - b
  } else {
    hasil = m * (1 - p / 100)
    laba = hasil - b
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
      <Text style={styles.title}>Kalkulator Harga</Text>
      <Text style={styles.subtitle}>Hitung harga jual dari margin, markup, atau diskon</Text>

      <Segmented
        options={[
          { label: 'Margin %', value: 'margin' },
          { label: 'Markup %', value: 'markup' },
          { label: 'Diskon', value: 'diskon' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <Card>
        {mode === 'diskon' && <Input label="Harga Asli (Rp)" value={modal} onChangeText={setModal} keyboardType="numeric" />}
        <Input label={mode === 'diskon' ? 'Harga Coret Tambahan? (opsional)' : 'HPP / Modal per Unit (Rp)'} value={mode === 'diskon' ? biaya : biaya} onChangeText={setBiaya} keyboardType="numeric" />
        <Input label={mode === 'diskon' ? 'Diskon (%)' : `${mode === 'margin' ? 'Target Margin' : 'Markup'} (%)`} value={persen} onChangeText={setPersen} keyboardType="numeric" />
      </Card>

      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.hasilLabel}>{mode === 'diskon' ? 'Harga Setelah Diskon' : 'Harga Jual Disarankan'}</Text>
        <Text style={styles.hasil}>{formatRupiah(hasil)}</Text>
        <View style={styles.divider} />
        <Text style={styles.laba}>Laba per unit: {formatRupiah(laba)}</Text>
        {b > 0 && hasil > 0 && (
          <Text style={styles.meta}>Margin efektif: {(((hasil - b) / hasil) * 100).toFixed(1)}%</Text>
        )}
      </Card>

      <Button title="Reset" variant="outline" icon="refresh-outline" onPress={() => { setModal(''); setBiaya(''); setPersen('') }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: fonts.h1, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.small, color: colors.textMuted, marginBottom: spacing.md },
  hasilLabel: { fontSize: fonts.small, color: colors.textMuted },
  hasil: { fontSize: 32, fontWeight: '900', color: colors.primary, marginVertical: spacing.sm },
  divider: { height: 1, width: '100%', backgroundColor: colors.border, marginVertical: spacing.sm },
  laba: { fontSize: fonts.h3, fontWeight: '700', color: colors.success },
  meta: { fontSize: fonts.small, color: colors.textMuted, marginTop: 4 },
})
