import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { NavItemData } from './nav-config'

interface NavItemProps extends NavItemData {
  collapsed: boolean
  isActive: boolean
}

export function NavItem({ to, label, icon: Icon, collapsed, isActive }: NavItemProps) {
  const content = (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-primary-container/20 text-primary border-l-4 border-primary font-bold rounded-r-xl'
          : 'text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent',
      )}>
      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={300}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            className="bg-surface border border-outline-variant text-on-surface text-xs rounded-xl px-3 py-2 shadow-lg z-50 font-medium">
            {label}
            <Tooltip.Arrow className="fill-surface" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return content
}
