import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  Zap,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Overview & analytics',
    icon: LayoutDashboard,
  },
  {
    to: '/leads',
    label: 'Leads',
    description: 'Manage prospects',
    icon: Users,
  },
  {
    to: '/whatsapp',
    label: 'WhatsApp',
    description: 'Conversations',
    icon: MessageCircle,
  },
]

const settingsItem = {
  to: '/account-management',
  label: 'Settings',
  description: 'Workspace settings',
  icon: Settings,
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Zap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>

          <div className="leading-none">
            <div className="text-sm font-semibold tracking-tight">
              LeadGen
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Workspace
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Workspace
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, description, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
                  isActive
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
                  )}

                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-background text-primary shadow-sm'
                        : 'bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {label}
                    </div>

                    <div
                      className={cn(
                        'mt-0.5 truncate text-[11px]',
                        isActive
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/80'
                      )}
                    >
                      {description}
                    </div>
                  </div>

                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="my-5 border-t border-border" />

        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          System
        </div>

        <NavLink
          to={settingsItem.to}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'bg-accent text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary" />
              )}

              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isActive
                    ? 'bg-background text-primary shadow-sm'
                    : 'bg-muted/50 text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                )}
              >
                <Settings className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Settings</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Workspace settings
                </div>
              </div>

              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </>
          )}
        </NavLink>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            LG
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">
              LeadGen Workspace
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System online
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}