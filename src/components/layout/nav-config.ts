import {
  LayoutDashboard, Smartphone, CreditCard, Store, UserRound,
  Megaphone, Wifi, Trophy, Users, Target, FileText, Activity,
} from 'lucide-react'

export interface NavItemData {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavGroup {
  label: string
  items: NavItemData[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/monitoring', label: 'Monitoring', icon: Activity },
    ],
  },
  {
    label: 'Channels',
    items: [
      { to: '/xlc', label: 'XLC Channel', icon: Smartphone },
      { to: '/gsf', label: 'GSF Revenue', icon: CreditCard },
      { to: '/merchant', label: 'Merchant', icon: Store },
      { to: '/wo', label: 'WO Agent', icon: UserRound },
      { to: '/expo', label: 'EXPO', icon: Megaphone },
      { to: '/xlsatu', label: 'XL Satu', icon: Wifi },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/target', label: 'Target vs Realisasi', icon: Target },
      { to: '/reporting', label: 'Reporting', icon: FileText },
      { to: '/elite', label: 'ELITE', icon: Trophy },
      { to: '/promotor', label: 'Promotor', icon: Users },
    ],
  },
]
