// Komponen UI bersama — pengganti kelas Tailwind (card, btn, badge, input)

import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, fonts, shadows } from '../theme'

// ---------- Card ----------
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

// ---------- Badge (chip) — ukuran diperbesar agar presisi di layar sentuh ----------
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary'
export function Badge({ label, variant = 'primary' }: { label: string; variant?: BadgeVariant }) {
  const map: Record<BadgeVariant, { bg: string; fg: string }> = {
    success: { bg: colors.successLight, fg: colors.success },
    warning: { bg: colors.warningLight, fg: colors.warning },
    danger: { bg: colors.dangerLight, fg: colors.danger },
    info: { bg: colors.infoLight, fg: colors.info },
    primary: { bg: colors.primaryLight, fg: colors.primary },
  }
  const c = map[variant]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  )
}

// ---------- Button ----------
type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline'
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
}: {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  icon?: keyof typeof Ionicons.glyphMap
  disabled?: boolean
}) {
  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'success' ? colors.success :
    variant === 'danger' ? colors.danger : 'transparent'
  const fg = variant === 'outline' ? colors.primary : colors.white
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: colors.primary },
        disabled && { opacity: 0.5 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  )
}

// ---------- Input ----------
export function Input({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  )
}

// ---------- StatCard (untuk Dashboard) ----------
export function StatCard({
  title,
  value,
  icon,
  color = colors.primary,
}: {
  title: string
  value: string
  icon: keyof typeof Ionicons.glyphMap
  color?: string
}) {
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
    </Card>
  )
}

// ---------- EmptyState ----------
export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="file-tray-outline" size={40} color={colors.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: fonts.small,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  buttonText: {
    fontSize: fonts.body,
    fontWeight: '700',
  },
  label: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fonts.body,
    color: colors.text,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: { fontSize: fonts.small, color: colors.textMuted },
  statValue: { fontSize: fonts.h2, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: fonts.body },
})

// ---------- SegmentedControl (pengganti tombol filter pill Tailwind) ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View style={segStyles.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          activeOpacity={0.8}
          onPress={() => onChange(o.value)}
          style={[segStyles.pill, value === o.value && segStyles.pillActive]}
        >
          <Text style={[segStyles.text, value === o.value && segStyles.textActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const segStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: fonts.body, fontWeight: '600', color: colors.textMuted },
  textActive: { color: colors.white },
})
