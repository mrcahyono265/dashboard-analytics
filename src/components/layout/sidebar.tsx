import { NavLink, useLocation, matchPath } from "react-router-dom";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  LayoutDashboard,
  Smartphone,
  CreditCard,
  Store,
  UserRound,
  Megaphone,
  Wifi,
  Trophy,
  Users,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  Activity,
  Upload,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/monitoring", label: "Monitoring", icon: Activity },
    ],
  },
  {
    label: "Channels",
    items: [
      { to: "/xlc", label: "XLC Channel", icon: Smartphone },
      { to: "/gsf", label: "GSF Revenue", icon: CreditCard },
      { to: "/merchant", label: "Merchant", icon: Store },
      { to: "/wo", label: "WO Agent", icon: UserRound },
      { to: "/expo", label: "EXPO", icon: Megaphone },
      { to: "/xlsatu", label: "XL Satu", icon: Wifi },
    ],
  },
  {
    label: "Reports",
    items: [
      { to: "/target", label: "Target vs Realisasi", icon: Target },
      { to: "/reporting", label: "Reporting", icon: FileText },
      { to: "/elite", label: "ELITE", icon: Trophy },
      { to: "/promotor", label: "Promotor", icon: Users },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onUploadClick?: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavItem({
  to,
  label,
  icon: Icon,
  collapsed,
  isActive,
}: {
  to: string;
  label: string;
  icon: any;
  collapsed: boolean;
  isActive: boolean;
}) {
  const content = (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-primary-container/20 text-primary border-l-4 border-primary font-bold rounded-r-xl"
          : "text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent",
      )}>
      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

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
    );
  }

  return content;
}

export function Sidebar({ collapsed, onToggle, onUploadClick, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

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
          "flex flex-col h-full z-40 fixed left-0 top-0 border-r border-outline-variant bg-surface transition-all duration-300",
          collapsed ? "w-16" : "w-sidebar-width",
          // Mobile: overlay drawer
          "max-md:w-[280px] max-md:shadow-2xl",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 shrink-0", collapsed ? "px-3 py-6 justify-center" : "px-6 py-6")}>
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
        <Tooltip.Provider delayDuration={300}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    matchPath({ path: item.to, end: true }, location.pathname) !== null;
                  return (
                    <NavItem
                      key={item.to}
                      {...item}
                      collapsed={collapsed}
                      isActive={isActive}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </Tooltip.Provider>
      </nav>

      {/* Bottom Section */}
      <div className={cn("border-t border-outline-variant/30 shrink-0", collapsed ? "p-2" : "p-4")}>
        {!collapsed && (
          <button
            onClick={onUploadClick}
            className="w-full mb-4 bg-primary-container text-on-primary-container py-2.5 rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Data
          </button>
        )}
        <div className="space-y-1">
          {!collapsed && (
            <>
              <button className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-xl w-full text-sm font-medium">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error-container/20 transition-all rounded-xl w-full text-sm font-medium">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </>
          )}
          {collapsed && (
            <div className="flex flex-col items-center gap-2">
              <button onClick={onUploadClick} className="p-2 bg-primary-container text-on-primary-container rounded-xl">
                <Upload className="h-4 w-4" />
              </button>
              <button onClick={logout} className="p-2 text-error hover:bg-error-container/20 rounded-xl">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle — hidden on mobile (drawer uses backdrop to close) */}
      <div className={cn("border-t border-outline-variant p-2 shrink-0 hidden md:block", collapsed && "flex justify-center")}>
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded-xl p-2",
            collapsed && "justify-center",
          )}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
