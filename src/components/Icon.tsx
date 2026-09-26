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

// Stat icon dengan gradient background
interface StatIconProps {
  icon: IconName
  color: 'indigo' | 'green' | 'red' | 'purple' | 'amber' | 'blue'
  size?: number
}

export function StatIcon({ icon, color, size = 48 }: StatIconProps) {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    green: 'from-green-500 to-emerald-600 shadow-green-200',
    red: 'from-red-500 to-rose-600 shadow-red-200',
    purple: 'from-purple-500 to-violet-600 shadow-purple-200',
    amber: 'from-amber-500 to-orange-600 shadow-amber-200',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-200',
  }

  return (
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
      <Icon name={icon} size={size / 2.5} className="text-white" />
    </div>
  )
}
