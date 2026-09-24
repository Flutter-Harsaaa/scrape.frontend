import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff,
} from 'lucide-react'

import {
  disconnectWhatsApp,
  getWhatsAppConnection,
  getWhatsAppStatus,
  type WhatsAppStatus,
} from '@/api/whatsapp'

export function WhatsAppConnection() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [connection, setConnection] =
    useState<Record<string, unknown> | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')

  const loadConnection = useCallback(async () => {
    try {
      setError('')

      const [statusData, connectionData] = await Promise.all([
        getWhatsAppStatus(),
        getWhatsAppConnection(),
      ])

      setStatus(statusData)
      setConnection(connectionData as Record<string, unknown>)
    } catch (err) {
      console.error(err)
      setError('Unable to load WhatsApp connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConnection()

    const interval = setInterval(loadConnection, 5000)

    return () => clearInterval(interval)
  }, [loadConnection])

  const handleRefreshQR = async () => {
    try {
      setRefreshing(true)
      setError('')

      const data = await getWhatsAppConnection()
      setConnection(data as Record<string, unknown>)
    } catch (err) {
      console.error(err)
      setError('Unable to refresh QR code.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again to reconnect.',
    )

    if (!confirmed) return

    try {
      setDisconnecting(true)
      setError('')

      await disconnectWhatsApp()
      await loadConnection()
    } catch (err) {
      console.error(err)
      setError('Unable to disconnect WhatsApp.')
    } finally {
      setDisconnecting(false)
    }
  }

  const state = status?.state?.toLowerCase() ?? ''

  const isConnected = state === 'open'

  const isConnecting =
    state === 'connecting' ||
    state === 'opening' ||
    state === 'close'

  const qrCode =
    typeof connection?.base64 === 'string'
      ? connection.base64
      : typeof connection?.qrcode === 'object' &&
          connection.qrcode !== null &&
          typeof (connection.qrcode as Record<string, unknown>).base64 ===
            'string'
        ? ((connection.qrcode as Record<string, unknown>)
            .base64 as string)
        : null

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading WhatsApp settings...
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Account Management</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">WhatsApp</span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />

              <h2 className="text-xl font-semibold tracking-tight">
                WhatsApp
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage the WhatsApp account connected to your LeadGen
              workspace.
            </p>
          </div>

          <StatusBadge connected={isConnected} />
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Connection section */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">
            Connection
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Connect your WhatsApp account to send and receive lead
            messages.
          </p>
        </div>

        <div className="p-5">
          {/* Account information */}
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-sm font-medium">
                  WhatsApp Account
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Instance: {status?.instance_name || 'lead gen'}
                </p>
              </div>
            </div>

            <StatusBadge connected={isConnected} />
          </div>

          <div className="my-6 border-t border-border" />

          {isConnected ? (
            <ConnectedState
              disconnecting={disconnecting}
              onDisconnect={handleDisconnect}
            />
          ) : (
            <DisconnectedState
              qrCode={qrCode}
              isConnecting={isConnecting}
              refreshing={refreshing}
              onRefresh={handleRefreshQR}
            />
          )}
        </div>
      </section>

      {/* Information section */}
      <section className="mt-4 rounded-xl border border-border bg-card">
        <div className="flex items-start gap-3 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">
              About this connection
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This WhatsApp account is used by LeadGen for lead
              communication. Keep the account connected to receive
              incoming messages and send outreach from the workspace.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        connected
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {connected ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}

      {connected ? 'Connected' : 'Disconnected'}
    </div>
  )
}

function ConnectedState({
  disconnecting,
  onDisconnect,
}: {
  disconnecting: boolean
  onDisconnect: () => void
}) {
  return (
    <div>
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

        <div>
          <p className="text-sm font-medium">
            WhatsApp is connected
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your LeadGen workspace can send and receive WhatsApp
            messages normally.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Disconnecting will require you to scan a QR code again.
        </p>

        <button
          type="button"
          onClick={onDisconnect}
          disabled={disconnecting}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unplug className="h-4 w-4" />
          )}

          {disconnecting
            ? 'Disconnecting...'
            : 'Disconnect WhatsApp'}
        </button>
      </div>
    </div>
  )
}

function DisconnectedState({
  qrCode,
  isConnecting,
  refreshing,
  onRefresh,
}: {
  qrCode: string | null
  isConnecting: boolean
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div>
      {isConnecting && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for WhatsApp connection...
        </div>
      )}

      {qrCode ? (
        <div className="flex flex-col items-center py-3 text-center">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <img
              src={
                qrCode.startsWith('data:')
                  ? qrCode
                  : `data:image/png;base64,${qrCode}`
              }
              alt="WhatsApp QR code"
              className="h-60 w-60 sm:h-64 sm:w-64"
            />
          </div>

          <h3 className="mt-5 text-sm font-semibold">
            Link your WhatsApp account
          </h3>

          <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
            Open WhatsApp on your phone, go to Linked Devices,
            choose Link a Device, and scan this QR code.
          </p>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            {refreshing ? 'Refreshing...' : 'Refresh QR'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-sm font-semibold">
            WhatsApp is disconnected
          </h3>

          <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
            Generate a QR code and scan it with WhatsApp to connect
            your account.
          </p>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            {refreshing ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>
      )}
    </div>
  )
}