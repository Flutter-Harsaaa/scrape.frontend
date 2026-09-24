import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Toaster } from './ui/toaster'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/whatsapp': 'WhatsApp',
  '/account-management': 'Settings',
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/leads/')) {
    return 'Lead Details'
  }

  if (pathname.startsWith('/account-management/')) {
    return 'Settings'
  }

  return pageTitles[pathname] ?? 'LeadGen'
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 h-full',
          'transition-transform duration-200 ease-out',
          'md:static md:z-auto md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main application */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Desktop top bar */}
        {/* <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5 md:flex">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={
                sidebarCollapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <div className="h-4 w-px bg-border" />

            <div>
              <h1 className="text-sm font-semibold">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </div>
        </header> */}

        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="h-4 w-px bg-border" />

            <span className="truncate text-sm font-semibold">
              {pageTitle}
            </span>
          </div>

          <div
            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
            title="System connected"
          />
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}