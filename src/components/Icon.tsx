import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Wallet,
  Package,
  Users,
  BarChart3,
  ShoppingCart,
  Truck,
  MessageCircle,
  QrCode,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Settings,
  Bell,
  LogOut,
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Zap,
  Target,
  Award,
  Cloud,
  Brain,
  Shield,
  CreditCard,
  Image,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react'

export type IconName = 
  | 'dashboard' | 'invoice' | 'calculator' | 'cashflow' | 'inventory'
  | 'customers' | 'analytics' | 'purchase' | 'supplier' | 'whatsapp' | 'qrcode'
  | 'menu' | 'close' | 'trending-up' | 'trending-down' | 'dollar'
  | 'alert' | 'check' | 'plus' | 'edit' | 'trash' | 'eye' | 'download'
  | 'print' | 'search' | 'filter' | 'calendar' | 'phone' | 'mail'
  | 'location' | 'star' | 'clock' | 'arrow-up' | 'arrow-down'
  | 'chevron-right' | 'chevron-down' | 'more' | 'settings' | 'bell'
  | 'logout' | 'circle' | 'check-circle' | 'x-circle' | 'alert-circle'
  | 'info' | 'help' | 'zap' | 'target' | 'award' | 'package'
  | 'cloud' | 'brain' | 'users' | 'shield'
  | 'truck' | 'credit-card' | 'message-circle' | 'image'
  | 'file-text'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  filled?: boolean
}

export function Icon({ name, size = 20, className = '', filled = false }: IconProps) {
  const props = {
    size,
    className,
    fill: filled ? 'currentColor' : 'none',
    strokeWidth: filled ? 0 : 2,
  }

  const icons = {
    'dashboard': LayoutDashboard,
    'invoice': FileText,
    'calculator': Calculator,
    'cashflow': Wallet,
    'inventory': Package,
    'customers': Users,
    'analytics': BarChart3,
    'purchase': ShoppingCart,
    'supplier': Truck,
    'whatsapp': MessageCircle,
    'qrcode': QrCode,
    'menu': Menu,
    'close': X,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'dollar': DollarSign,
    'alert': AlertTriangle,
    'check': CheckCircle2,
    'plus': Plus,
    'edit': Edit2,
    'trash': Trash2,
    'eye': Eye,
    'download': Download,
    'print': Printer,
    'search': Search,
    'filter': Filter,
    'calendar': Calendar,
    'phone': Phone,
    'mail': Mail,
    'location': MapPin,
    'star': Star,
    'clock': Clock,
    'arrow-up': ArrowUpRight,
    'arrow-down': ArrowDownRight,
    'chevron-right': ChevronRight,
    'chevron-down': ChevronDown,
    'more': MoreVertical,
    'settings': Settings,
    'bell': Bell,
    'logout': LogOut,
    'circle': Circle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'alert-circle': AlertCircle,
    'info': Info,
    'help': HelpCircle,
    'zap': Zap,
    'target': Target,
    'award': Award,
    'package': Package,
    'cloud': Cloud,
    'brain': Brain,
    'users': Users,
    'shield': Shield,
    'truck': Truck,
    'credit-card': CreditCard,
    'message-circle': MessageCircle,
    'image': Image,
    'file-text': FileText,
  }

  const IconComponent = icons[name]
  return IconComponent ? <IconComponent {...props} /> : null
}

// Interactive icon button dengan outlined/filled state
interface IconButtonProps {
  icon: IconName
  label?: string
  active?: boolean
  onClick?: () => void
  className?: string
  size?: number
}

export function IconButton({ icon, label, active = false, onClick, className = '', size = 20 }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${active 
          ? 'bg-indigo-50 text-indigo-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
        ${className}
      `}
    >
      <Icon name={icon} size={size} filled={active} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

// Stat icon dengan soft pastel background
interface StatIconProps {
  icon: IconName
  color: 'indigo' | 'green' | 'red' | 'purple' | 'amber' | 'blue' | 'slate' | 'teal' | 'rose' | 'violet'
  size?: number
  variant?: 'solid' | 'soft'
}

export function StatIcon({ icon, color, size = 48, variant = 'soft' }: StatIconProps) {
  const colorClasses = {
    indigo: variant === 'soft' 
      ? 'bg-indigo-50 text-indigo-600' 
      : 'from-indigo-400 to-indigo-500 shadow-indigo-100 text-white',
    green: variant === 'soft' 
      ? 'bg-emerald-50 text-emerald-600' 
      : 'from-emerald-400 to-emerald-500 shadow-emerald-100 text-white',
    red: variant === 'soft' 
      ? 'bg-rose-50 text-rose-600' 
      : 'from-rose-400 to-rose-500 shadow-rose-100 text-white',
    purple: variant === 'soft' 
      ? 'bg-violet-50 text-violet-600' 
      : 'from-violet-400 to-violet-500 shadow-violet-100 text-white',
    amber: variant === 'soft' 
      ? 'bg-amber-50 text-amber-600' 
      : 'from-amber-400 to-amber-500 shadow-amber-100 text-white',
    blue: variant === 'soft' 
      ? 'bg-sky-50 text-sky-600' 
      : 'from-sky-400 to-sky-500 shadow-sky-100 text-white',
    slate: variant === 'soft' 
      ? 'bg-slate-50 text-slate-600' 
      : 'from-slate-400 to-slate-500 shadow-slate-100 text-white',
    teal: variant === 'soft' 
      ? 'bg-teal-50 text-teal-600' 
      : 'from-teal-400 to-teal-500 shadow-teal-100 text-white',
    rose: variant === 'soft' 
      ? 'bg-rose-50 text-rose-600' 
      : 'from-rose-400 to-rose-500 shadow-rose-100 text-white',
    violet: variant === 'soft' 
      ? 'bg-violet-50 text-violet-600' 
      : 'from-violet-400 to-violet-500 shadow-violet-100 text-white',
  }

  const baseClasses = variant === 'soft'
    ? `w-12 h-12 rounded-xl flex items-center justify-center`
    : `w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md`

  return (
    <div className={`${baseClasses} ${colorClasses[color]}`}>
      <Icon name={icon} size={size / 2.5} />
    </div>
  )
}
