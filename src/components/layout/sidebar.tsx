import { NavLink, useLocation, matchPath } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as Collapsible from "@radix-ui/react-collapsible";
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
} from "lucide-react";
import { useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Channels",
    items: [
      { to: "/xlc", label: "XLC", icon: Smartphone },
      { to: "/gsf", label: "GSF", icon: CreditCard },
      { to: "/merchant", label: "Merchant", icon: Store },
      { to: "/wo", label: "WO Agent", icon: UserRound },
      { to: "/expo", label: "EXPO", icon: Megaphone },
      { to: "/xlsatu", label: "XL Satu", icon: Wifi },
    ],
  },
  {
    label: "Reports",
    items: [
      { to: "/elite", label: "ELITE", icon: Trophy },
      { to: "/promotor", label: "Promotor", icon: Users },
      { to: "/target", label: "Target", icon: Target },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
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
        "rounded-lg text-sm font-medium transition-all duration-150",
        collapsed
          ? "flex items-center w-full py-2.5"
          : "flex items-center gap-3 px-3 py-2.5",
        isActive
          ? collapsed
            ? "bg-blue-500 text-white dark:bg-sidebar-active dark:text-primary"
            : "bg-sidebar-active text-primary border-l-[3px] border-primary pl-[calc(0.75rem-3px)]"
          : collapsed
            ? "text-text-secondary hover:bg-sidebar-hover hover:text-text"
            : "text-text-secondary hover:bg-sidebar-hover hover:text-text border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]",
      )}>
      <Icon className={cn("h-5 w-5 shrink-0", collapsed && "m-auto")} />
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
            className="bg-surface border border-border text-text text-xs rounded-md px-2.5 py-1.5 shadow-md z-50">
            {label}
            <Tooltip.Arrow className="fill-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Channels: true,
    Reports: true,
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-60",
      )}>
      <div
        className={cn(
          "flex h-16 items-center border-b border-border shrink-0",
          collapsed ? "justify-center" : "px-4",
        )}>
        <div
          className={cn(
            "flex items-center rounded-lg bg-primary",
            collapsed ? "h-8 w-8 justify-center" : "h-8 gap-2.5 px-2",
          )}>
          <BarChart3 className="h-4 w-4 text-white shrink-0" />
          {!collapsed && (
            <>
              <div className="h-4 w-[1px] bg-white/30" />
              <span className="text-xs font-semibold text-white">Prio</span>
            </>
          )}
        </div>
      </div>

      <div
        className={cn("flex-1 overflow-y-auto", collapsed ? "p-1.5" : "p-2")}>
        <div className="space-y-4">
          <Tooltip.Provider delayDuration={300}>
            {navGroups.map((group) => (
              <Collapsible.Root
                key={group.label}
                open={collapsed ? true : openGroups[group.label]}
                onOpenChange={(open) =>
                  setOpenGroups((prev) => ({ ...prev, [group.label]: open }))
                }>
                {!collapsed && (
                  <Collapsible.Trigger asChild>
                    <button className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-secondary transition-colors">
                      {group.label}
                    </button>
                  </Collapsible.Trigger>
                )}
                <Collapsible.Content className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      matchPath(
                        { path: item.to, end: true },
                        location.pathname,
                      ) !== null;
                    return (
                      <NavItem
                        key={item.to}
                        {...item}
                        collapsed={collapsed}
                        isActive={isActive}
                      />
                    );
                  })}
                </Collapsible.Content>
              </Collapsible.Root>
            ))}
          </Tooltip.Provider>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border p-2 shrink-0",
          collapsed ? "flex justify-center" : "",
        )}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggle}
          className={collapsed ? "" : "w-full justify-center"}>
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
