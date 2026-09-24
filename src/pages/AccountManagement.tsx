import {
  Bell,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Monitor,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
} from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const settingsTabs = [
  {
    label: 'General',
    path: '/account-management',
    icon: Settings,
  },
  {
    label: 'WhatsApp',
    path: '/account-management/whatsapp',
    icon: MessageCircle,
  },
  {
    label: 'Users',
    path: '#',
    icon: Users,
    disabled: true,
  },
  {
    label: 'Security',
    path: '#',
    icon: Shield,
    disabled: true,
  },
  {
    label: 'Notifications',
    path: '#',
    icon: Bell,
    disabled: true,
  },
]

export function AccountManagement() {
  const location = useLocation()

  const isWhatsApp =
    location.pathname === '/account-management/whatsapp'

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your LeadGen account, workspace and preferences.
          </p>
        </div>

        {/* Settings tabs */}
        <div className="mb-9 border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon

              const active =
                !tab.disabled &&
                ((tab.path === '/account-management' && !isWhatsApp) ||
                  location.pathname === tab.path)

              if (tab.disabled) {
                return (
                  <div
                    key={tab.label}
                    className="flex shrink-0 cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground/50"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}

                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium">
                      Soon
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Page content */}
        {isWhatsApp ? (
          <Outlet />
        ) : (
          <GeneralSettings />
        )}
      </div>
    </div>
  )
}

function GeneralSettings() {
  return (
    <div>

      {/* Page heading */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold">
          General
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Basic settings for your LeadGen workspace.
        </p>
      </div>

      {/* Workspace */}
      <SettingsSection
        title="Workspace"
        description="Basic information about your LeadGen workspace."
      >
        <SettingsRow
          title="Workspace name"
          description="The name used to identify this workspace."
        >
          <span className="text-sm font-medium">
            LeadGen
          </span>
        </SettingsRow>

        <SettingsRow
          title="Platform"
          description="The primary purpose of this workspace."
        >
          <span className="text-sm text-muted-foreground">
            Lead generation & outreach
          </span>
        </SettingsRow>
      </SettingsSection>

      {/* Connected services */}
      <SettingsSection
        title="Connected services"
        description="Services connected to your LeadGen workspace."
      >
        <SettingsRow
          title="WhatsApp"
          description="WhatsApp account used to communicate with leads."
        >
          <Link
            to="/account-management/whatsapp"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Manage
          </Link>
        </SettingsRow>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection
        title="Appearance"
        description="Choose how LeadGen looks on your device."
      >
        <SettingsRow
          title="Theme"
          description="Select light, dark or follow your system preference."
        >
          <button
            type="button"
            className="flex h-10 min-w-[150px] items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              System
            </span>

            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </SettingsRow>

        <SettingsRow
          title="Interface density"
          description="Control the amount of information displayed on screen."
        >
          <button
            type="button"
            className="flex h-10 min-w-[150px] items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-sm"
          >
            <span>Comfortable</span>

            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        description="Control how LeadGen communicates important events."
      >
        <SettingsRow
          title="Browser notifications"
          description="Receive notifications for important workspace events."
        >
          <Toggle enabled />
        </SettingsRow>

        <SettingsRow
          title="WhatsApp notifications"
          description="Show notifications when new WhatsApp messages arrive."
        >
          <Toggle enabled />
        </SettingsRow>
      </SettingsSection>

      {/* Account */}
      <SettingsSection
        title="Account"
        description="Information about your current LeadGen account."
      >
        <SettingsRow
          title="Account status"
          description="Current status of this LeadGen account."
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active
          </span>
        </SettingsRow>

        <SettingsRow
          title="Application"
          description="Current LeadGen application environment."
        >
          <span className="text-sm text-muted-foreground">
            LeadGen
          </span>
        </SettingsRow>
      </SettingsSection>

      {/* Future settings note */}
      <div className="mt-10 flex items-start gap-3 rounded-lg border border-dashed border-border px-4 py-4">
        <Settings className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

        <div>
          <p className="text-sm font-medium">
            More settings coming soon
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            User permissions, security preferences and notification
            customization will be available here.
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-border py-7">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <div>
        {children}
      </div>
    </section>
  )
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border/70 py-5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  )
}

function Toggle({
  enabled,
}: {
  enabled: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled
          ? 'bg-foreground'
          : 'bg-muted'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
          enabled
            ? 'left-6'
            : 'left-1'
        }`}
      />
    </button>
  )
}