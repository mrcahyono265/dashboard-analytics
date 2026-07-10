import { useLocation, matchPath } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { navGroups } from './nav-config'
import { NavItem } from './nav-item'
import { SidebarBottom } from './sidebar-bottom'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onUploadClick?: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, onUploadClick, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col h-full z-40 fixed left-0 top-0 border-r border-outline-variant bg-surface transition-all duration-300',
          collapsed ? 'w-16' : 'w-sidebar-width',
          'max-md:w-[280px] max-md:shadow-2xl',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}>
        {/* Logo */}
        <div className={cn('flex items-center gap-3 shrink-0', collapsed ? 'px-3 py-6 justify-center' : 'px-6 py-6')}>
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-lg shadow-primary-container/20 shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-primary font-headline font-bold text-lg leading-tight">Prio Dashboard</h1>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Sales Analytics</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-3 space-y-2 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((navItem) => (
                  <NavItem
                    key={navItem.to}
                    {...navItem}
                    collapsed={collapsed}
                    isActive={matchPath({ path: navItem.to, end: true }, location.pathname) !== null}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <SidebarBottom collapsed={collapsed} onToggle={onToggle} onUploadClick={onUploadClick} onLogout={logout} />
      </aside>
    </>
  )
}
