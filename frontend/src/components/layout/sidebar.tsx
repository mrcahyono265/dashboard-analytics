import { useLocation, matchPath, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BarChart3, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { navGroups, bottomNavItems, type NavGroup } from './nav-config'
import { API_ORIGIN } from '@/lib/api'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  isMobile: boolean
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, isMobile }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const showFull = isMobile || !collapsed

  const isPathActive = (path: string) =>
    matchPath({ path, end: true }, location.pathname) !== null

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'flex flex-col h-dvh z-40 fixed left-0 top-0 border-r border-outline-variant bg-surface transition-all duration-300',
          isMobile ? 'w-sidebar-width' : collapsed ? 'w-16' : 'w-sidebar-width',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 shrink-0', showFull ? 'px-6 py-6' : 'px-3 py-6 justify-center')}>
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-lg shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          {showFull && (
            <div>
              <h1 className="text-primary font-headline font-bold text-lg leading-tight">Analitics</h1>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Sales Analytics</p>
            </div>
          )}
        </div>

        {/* Navigation groups — always expanded */}
        <nav className="flex-1 mt-2 px-3 space-y-1 overflow-y-auto">
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              showFull={showFull}
              isActive={isPathActive}
              onNavClick={onMobileClose}
            />
          ))}
        </nav>

        {/* Bottom nav items */}
        <div className="px-3 py-2 space-y-1 border-t border-outline-variant/30 shrink-0">
          {bottomNavItems.map((item) => {
            const active = isPathActive(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
                  showFull ? 'px-4 py-2.5' : 'justify-center p-2.5',
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high',
                )}
                title={showFull ? undefined : item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showFull && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* User + logout */}
        <div className={cn('border-t border-outline-variant p-3 shrink-0', !showFull && 'px-2')}>
          {showFull ? (
            <div className="space-y-2">
              <Link to="/settings" className={cn('flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors', isPathActive('/settings') ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container-high')}>
                {user?.avatarUrl ? (
                  <img src={`${API_ORIGIN}${user.avatarUrl}`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-container/30 border border-primary-container flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {user?.displayName?.charAt(0) || '?'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-on-surface truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-medium">{user?.role || ''}</p>
                </div>
              </Link>
              <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 rounded-xl w-full text-sm font-medium">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link to="/settings" className={cn('p-1.5 rounded-lg transition-colors', isPathActive('/settings') ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-primary')}>
                {user?.avatarUrl ? (
                  <img src={`${API_ORIGIN}${user.avatarUrl}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-container/30 border border-primary-container flex items-center justify-center text-primary font-bold text-xs">
                    {user?.displayName?.charAt(0) || '?'}
                  </div>
                )}
              </Link>
              <button onClick={logout} className="p-2 text-error hover:bg-error-container/20 rounded-lg">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <div className="border-t border-outline-variant p-2 shrink-0 hidden md:block">
          <button
            onClick={onToggle}
            className={cn('flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl p-2 w-full', collapsed && 'justify-center')}
          >
            {!collapsed ? <><ChevronDown className="h-4 w-4 rotate-90" /><span className="text-xs font-medium">Collapse</span></> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}

// Non-collapsible group section — label is visual header, all items always visible
function NavGroupSection({ group, showFull, isActive, onNavClick }: {
  group: NavGroup
  showFull: boolean
  isActive: (path: string) => boolean
  onNavClick: () => void
}) {
  return (
    <div>
      {showFull && (
        <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {group.label}
        </p>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const active = isActive(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
                showFull ? 'px-4 py-2.5' : 'justify-center p-2.5',
                active
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
              title={showFull ? undefined : item.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showFull && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
