import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Star,
} from 'lucide-react'

import { businessesApi, type BusinessUpdate } from '@/api/businesses'
import { messagesApi, parseMessage } from '@/api/messages'
import {
  getWhatsAppConversations,
  sendFirstWhatsAppMessage,
  type WhatsAppConversation,
} from '@/api/whatsapp'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WebsiteStatusBadge, LeadStatusBadge } from '@/components/StatusBadge'
import { toast } from '@/components/ui/use-toast'

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'WON', 'LOST']

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Not set'
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return digits
}

function CopyPhone({ phone }: { phone: string | null | undefined }) {
  const [copied, setCopied] = useState(false)

  if (!phone) return null

  async function copy() {
    await navigator.clipboard.writeText(phone ?? '')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copy} title="Copy phone">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 min-w-0 text-sm">{children}</div>
      </div>
    </div>
  )
}

function MessageStatus({ status }: { status: string | null | undefined }) {
  if (status === 'READ') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCheck className="h-3.5 w-3.5" /> Read</span>
  }
  if (status === 'DELIVERED') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCheck className="h-3.5 w-3.5" /> Delivered</span>
  }
  if (status === 'SENT') {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><Check className="h-3.5 w-3.5" /> Sent</span>
  }
  if (status === 'FAILED') {
    return <span className="text-xs text-destructive">Send failed</span>
  }
  if (status === 'SENDING') {
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Sending</span>
  }
  return null
}

export function LeadDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const businessId = Number(id)

  const [notes, setNotes] = useState('')
  const [notesChanged, setNotesChanged] = useState(false)

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessesApi.get(businessId),
    enabled: Number.isFinite(businessId),
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', businessId],
    queryFn: () => messagesApi.list(businessId),
    enabled: Number.isFinite(businessId),
  })

  const { data: conversations = [] } = useQuery<WhatsAppConversation[]>({
    queryKey: ['whatsapp-conversations'],
    queryFn: getWhatsAppConversations,
    enabled: Number.isFinite(businessId),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (business && !notesChanged) setNotes(business.notes ?? '')
  }, [business?.notes, notesChanged])

  const conversation = useMemo(
    () => conversations.find((item) => item.business_id === businessId) ?? null,
    [conversations, businessId],
  )

  const latestMessage = messages?.[0]
  const parsedLatest = latestMessage ? parseMessage(latestMessage.generated_message) : null
  const whatsappMessage = parsedLatest?.whatsapp?.trim() ?? ''

  const updateMutation = useMutation({
    mutationFn: (data: BusinessUpdate) => businessesApi.update(businessId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['business', businessId], updated)
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setNotesChanged(false)
      toast({ title: 'Saved' })
    },
    onError: () => toast({ title: 'Could not save changes', variant: 'destructive' }),
  })

  const generateMutation = useMutation({
    mutationFn: () => messagesApi.generate(businessId, 'initial', 'whatsapp'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] })
      toast({ title: 'WhatsApp message generated' })
    },
    onError: () => toast({ title: 'Could not generate message', variant: 'destructive' }),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!whatsappMessage) throw new Error('Generate a WhatsApp message first.')
      return sendFirstWhatsAppMessage(businessId, whatsappMessage)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] })
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] })
      toast({ title: 'WhatsApp message sent', description: 'The lead conversation is now available.' })
      navigate(`/whatsapp?conversationId=${result.conversation.id}`)
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || error?.message || 'WhatsApp message failed.'
      toast({ title: 'WhatsApp send failed', description: detail, variant: 'destructive' })
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => businessesApi.delete(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate('/leads')
    },
    onError: () => toast({ title: 'Could not delete lead', variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-5 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
      </div>
    )
  }

  if (!business) {
    return <div className="p-8 text-sm text-muted-foreground">Lead not found.</div>
  }

  const currentNotes = notesChanged ? notes : (business.notes ?? '')
  const phone = business.phone
  const mobile = business.phone_type === 'mobile' && !!normalizePhone(phone)
  const websiteHref = business.website
    ? business.website.startsWith('http') ? business.website : `https://${business.website}`
    : null

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{business.name}</h1>
              <LeadStatusBadge status={business.lead_status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {business.category || 'Business'}{business.address ? ` · ${business.address}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          {conversation ? (
            <Button size="sm" variant="outline" onClick={() => navigate(`/whatsapp?conversationId=${conversation.id}`)}>
              <MessageCircle className="mr-1.5 h-4 w-4" /> Open Conversation
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Delete "${business.name}"?`)) deleteMutation.mutate()
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Contact + opportunity */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <InfoItem icon={Phone} label="Phone">
              <div className="flex items-center gap-1">
                <span>{phone || 'No phone number'}</span>
                <CopyPhone phone={phone} />
              </div>
              {phone && <p className="mt-1 text-xs text-muted-foreground">{formatStatus(business.phone_type)}</p>}
            </InfoItem>

            <InfoItem icon={Globe} label="Website">
              {websiteHref ? (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-primary hover:underline">
                  <span className="truncate">{business.website}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : <span className="text-muted-foreground">No website</span>}
            </InfoItem>

            <InfoItem icon={MapPin} label="Location">
              <span className="break-words">{business.address || 'Address not available'}</span>
            </InfoItem>

            <InfoItem icon={Star} label="Reputation">
              <div className="flex items-center gap-2">
                {business.rating != null ? <span className="font-medium">{business.rating.toFixed(1)} / 5</span> : <span className="text-muted-foreground">No rating</span>}
                {business.review_count != null && <span className="text-xs text-muted-foreground">({business.review_count.toLocaleString()} reviews)</span>}
              </div>
            </InfoItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-sm">Opportunity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Website</span>
              <WebsiteStatusBadge status={business.website_status} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className={mobile ? 'text-sm font-medium text-emerald-500' : 'text-sm font-medium text-amber-500'}>
                {mobile ? 'WhatsApp available' : business.phone_type === 'landline' ? 'Landline' : 'Limited'}
              </span>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
              {business.website_status === 'NO_WEBSITE'
                ? 'No website is visible for this lead — this may be a useful opening for a digital presence conversation.'
                : business.website_status === 'BROKEN'
                  ? 'The website appears unavailable — this may be a useful opening for a website improvement conversation.'
                  : 'Use the contact and reputation signals above to personalize the first conversation.'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outreach */}
      <Card className="mt-5">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm">AI Outreach</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">A concise WhatsApp message personalized for this lead.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            {whatsappMessage ? 'Regenerate' : 'Generate'}
          </Button>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : whatsappMessage ? (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6">{whatsappMessage}</p>
              <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <MessageStatus status={latestMessage?.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(whatsappMessage); toast({ title: 'Message copied' }) }}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                  </Button>
                  {conversation ? (
                    <Button size="sm" onClick={() => navigate(`/whatsapp?conversationId=${conversation.id}`)}>
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Open Conversation
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || !mobile}>
                      {sendMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                      {sendMutation.isPending ? 'Sending...' : 'Send WhatsApp'}
                    </Button>
                  )}
                </div>
              </div>
              {!mobile && !conversation && <p className="mt-2 text-xs text-amber-500">A mobile WhatsApp number is required to send the first message.</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No WhatsApp outreach message yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Generate a personalized message when you are ready to contact this lead.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM + notes */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-sm">CRM</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Lead status</p>
              <Select value={business.lead_status} onValueChange={(value) => updateMutation.mutate({ lead_status: value })} disabled={updateMutation.isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map((status) => <SelectItem key={status} value={status}>{formatStatus(status)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Next follow-up</p>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                  value={business.next_followup_date ? business.next_followup_date.split('T')[0] : ''}
                  onChange={(event) => updateMutation.mutate({ next_followup_date: event.target.value ? new Date(`${event.target.value}T00:00:00`).toISOString() : null })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-4"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={currentNotes}
              onChange={(event) => { setNotes(event.target.value); setNotesChanged(true) }}
              placeholder="Record useful context from calls or conversations..."
              className="min-h-28 resize-none"
            />
            {notesChanged && (
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => updateMutation.mutate({ notes: currentNotes })} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Save Notes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
