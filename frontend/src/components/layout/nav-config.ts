import {
  LayoutDashboard, Smartphone, CreditCard, Store, UserRound,
  Megaphone, Wifi, Trophy, Users, Target, FileText, Activity,
  Database, FilePlus, Settings, BarChart3, ScrollText, Package,
} from 'lucide-react'

export interface NavItemData {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavGroup {
  label: string
  defaultOpen?: boolean
  items: NavItemData[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    defaultOpen: true,
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Achievement',
    defaultOpen: false,
    items: [
      { to: '/achievement/xlc-gsf', label: 'XLC & GSF', icon: ScrollText },
      { to: '/achievement/wo', label: 'WO Agent', icon: UserRound },
      { to: '/achievement/expo', label: 'EXPO', icon: Megaphone },
    ],
  },
  {
    label: 'Channels',
    defaultOpen: false,
    items: [
      { to: '/xlc', label: 'XLC', icon: Smartphone },
      { to: '/gsf', label: 'GSF', icon: CreditCard },
      { to: '/merchant', label: 'Merchant', icon: Store },
      { to: '/wo', label: 'WO', icon: UserRound },
      { to: '/expo', label: 'EXPO', icon: Megaphone },
    ],
  },
  {
    label: 'Products',
    defaultOpen: false,
    items: [
      { to: '/prio-xlc', label: 'prioXLC', icon: Package },
      { to: '/xlsatu', label: 'XL Satu', icon: Wifi },
      { to: '/elite', label: 'ELITE', icon: Trophy },
    ],
  },
  {
    label: 'Reports',
    defaultOpen: false,
    items: [
      { to: '/target', label: 'Target', icon: Target },
      { to: '/reporting', label: 'Reporting', icon: FileText },
      { to: '/monitoring', label: 'Monitoring', icon: Activity },
      { to: '/promotor', label: 'Promotor', icon: Users },
      { to: '/wo-agent', label: 'WOAgent', icon: BarChart3 },
    ],
  },
]

export const bottomNavItems: NavItemData[] = [
  { to: '/data-source', label: 'Data Source', icon: Database },
  { to: '/data-entry', label: 'Data Entry', icon: FilePlus },
]
