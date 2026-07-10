import { Upload, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarBottomProps {
  collapsed: boolean
  onToggle: () => void
  onUploadClick?: () => void
  onLogout: () => void
}

export function SidebarBottom({ collapsed, onToggle, onUploadClick, onLogout }: SidebarBottomProps) {
  return (
    <>
      {/* Bottom actions */}
      <div className={cn('border-t border-outline-variant/30 shrink-0', collapsed ? 'p-2' : 'p-4')}>
        {!collapsed ? (
          <>
            <button
              onClick={onUploadClick}
              className="w-full mb-4 bg-primary-container text-on-primary-container py-2.5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Data
            </button>
            <div className="space-y-1">
              <button className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-xl w-full text-sm font-medium">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error-container/20 transition-all rounded-xl w-full text-sm font-medium">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button onClick={onUploadClick} className="p-2 bg-primary-container text-on-primary-container rounded-xl">
              <Upload className="h-4 w-4" />
            </button>
            <button onClick={onLogout} className="p-2 text-error hover:bg-error-container/20 rounded-xl">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle — hidden on mobile */}
      <div className={cn('border-t border-outline-variant p-2 shrink-0 hidden md:block', collapsed && 'flex justify-center')}>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-xl p-2',
            collapsed && 'justify-center',
          )}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </>
  )
}
