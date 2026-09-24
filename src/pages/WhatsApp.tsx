import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  CheckCheck,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  Send,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'

import {
  getWhatsAppConversations,
  getWhatsAppMessages,
  getWhatsAppStatus,
  sendWhatsAppMessage,
  type WhatsAppConversation,
  type WhatsAppMessage,
} from '@/api/whatsapp'

function formatTime(value: string | null) {
  if (!value) return ''

  const normalizedValue =
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      ? value
      : `${value}Z`

  return new Date(normalizedValue).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatConversationTime(value: string | null) {
  if (!value) return ''

  const normalizedValue =
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      ? value
      : `${value}Z`

  const date = new Date(normalizedValue)
  const now = new Date()

  const dateIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

  const nowIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  if (dateIST === nowIST) {
    return formatTime(value)
  }

  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  })
}

function MessageStatus({ status }: { status: string }) {
  if (status === 'READ' || status === 'DELIVERED') {
    return <CheckCheck className="h-3.5 w-3.5" />
  }

  if (status === 'SENT') {
    return <Check className="h-3.5 w-3.5" />
  }

  return null
}

export function WhatsApp() {
  const [searchParams] = useSearchParams()
  const requestedConversationId = Number(searchParams.get('conversationId') || 0)
  const requestedLeadId = Number(searchParams.get('leadId') || 0)

  const [status, setStatus] = useState('unknown')
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  async function loadStatus() {
    try {
      const data = await getWhatsAppStatus()
      setStatus(data.state)
    } catch {
      setStatus('offline')
    }
  }

  async function loadConversations() {
    try {
      const data = await getWhatsAppConversations()
      setConversations(data)

      if (selectedConversation) {
        const updated = data.find(
          (conversation) => conversation.id === selectedConversation.id
        )

        if (updated) {
          setSelectedConversation(updated)
        }
      }
    } catch (error) {
      console.error('Failed to load WhatsApp conversations', error)
    }
  }

  async function openConversation(
    conversation: WhatsAppConversation
  ) {
    setSelectedConversation(conversation)
    setLoadingMessages(true)

    try {
      const data = await getWhatsAppMessages(conversation.id)
      setMessages(data)

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? { ...item, unread_count: 0 }
            : item
        )
      )
    } catch (error) {
      console.error('Failed to load WhatsApp messages', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!conversations.length) return

    const target = requestedConversationId
      ? conversations.find((conversation) => conversation.id === requestedConversationId)
      : requestedLeadId
        ? conversations.find((conversation) => conversation.business_id === requestedLeadId)
        : null

    if (target && selectedConversation?.id !== target.id) {
      openConversation(target)
    }
  }, [conversations, requestedConversationId, requestedLeadId, selectedConversation?.id])

  async function handleSend() {
    const text = messageText.trim()

    if (!text || !selectedConversation || sending) {
      return
    }

    setSending(true)

    try {
      const newMessage = await sendWhatsAppMessage(
        selectedConversation.id,
        text
      )

      setMessages((current) => [...current, newMessage])
      setMessageText('')

      await loadConversations()
    } catch (error) {
      console.error('Failed to send WhatsApp message', error)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadStatus()
    loadConversations()

    const interval = window.setInterval(async () => {
      await loadStatus()
      await loadConversations()

      if (selectedConversation) {
        try {
          const data = await getWhatsAppMessages(
            selectedConversation.id
          )

          setMessages(data)
        } catch (error) {
          console.error(
            'Failed to refresh WhatsApp messages',
            error
          )
        }
      }
    }, 5000)

    return () => window.clearInterval(interval)
  }, [selectedConversation?.id])

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    openConversation(selectedConversation)
  }, [selectedConversation?.id])

  const filteredConversations = conversations.filter((conversation) => {
    const query = search.toLowerCase()

    return (
      conversation.business_name?.toLowerCase().includes(query) ||
      conversation.phone_number.includes(query) ||
      conversation.last_message?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-[600px] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
        <div>
          <h1 className="text-lg font-semibold">WhatsApp</h1>
          <p className="text-xs text-muted-foreground">
            Manage lead conversations
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
          {status === 'open' ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Conversations */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  No conversations
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  WhatsApp conversations with leads will appear here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => openConversation(conversation)}
                  className={`flex w-full gap-3 border-b border-border p-3 text-left transition-colors hover:bg-accent/50 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-accent'
                      : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {conversation.business_name
                      ?.charAt(0)
                      .toUpperCase() || '?'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {conversation.business_name ||
                          conversation.phone_number}
                      </p>

                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatConversationTime(
                          conversation.last_message_at
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.last_message || 'No messages'}
                      </p>

                      {conversation.unread_count > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat */}
        <main className="flex min-w-0 flex-1 flex-col bg-background">
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>

              <h2 className="text-lg font-semibold">
                Select a conversation
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Choose a lead from the conversation list.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {selectedConversation.business_name
                      ?.charAt(0)
                      .toUpperCase() || '?'}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {selectedConversation.business_name ||
                        selectedConversation.phone_number}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.phone_number}
                    </p>
                  </div>
                </div>

                <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message) => {
                    const outgoing = message.direction === 'outgoing'

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          outgoing
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            outgoing
                              ? 'rounded-br-md bg-primary text-primary-foreground'
                              : 'rounded-bl-md bg-muted text-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>

                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              outgoing
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>
                              {formatTime(
                                message.message_timestamp ||
                                  message.created_at
                              )}
                            </span>

                            {outgoing && (
                              <MessageStatus status={message.status} />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey
                      ) {
                        event.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 px-1 text-[10px] text-muted-foreground">
                  Press Enter to send • Shift + Enter for a new line
                </p>
              </div>
            </>
          )}
        </main>

        {/* Lead panel */}
        <aside className="hidden w-72 shrink-0 border-l border-border bg-card xl:flex xl:flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-border p-5">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {selectedConversation.business_name
                    ?.charAt(0)
                    .toUpperCase() || '?'}
                </div>

                <h2 className="font-semibold">
                  {selectedConversation.business_name ||
                    'Unknown Lead'}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {selectedConversation.phone_number}
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lead Status
                  </p>

                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {selectedConversation.lead_status ||
                      'NEW'}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Contact
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedConversation.business_name ||
                      'Unknown'}
                  </div>
                </div>

                <a
                  href={`/leads/${selectedConversation.business_id}`}
                  className="block rounded-md border border-border px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-accent"
                >
                  Open Lead
                </a>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Lead details will appear here.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}