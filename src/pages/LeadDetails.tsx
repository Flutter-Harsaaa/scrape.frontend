import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Globe, Phone, MapPin, Star, Loader2,
  Wand2, Copy, Check, RefreshCw, Trash2, MessageCircle, Send, ExternalLink
} from 'lucide-react'
import { businessesApi, type BusinessUpdate } from '@/api/businesses'
import { messagesApi, parseMessage } from '@/api/messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { WebsiteStatusBadge, LeadStatusBadge } from '@/components/StatusBadge'
import { toast } from '@/components/ui/use-toast'

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'WON', 'LOST']

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={copy}>
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function WhatsAppButton({
  phone,
  phoneType,
  message,
  status,
  isPending,
  onSend,
}: {
  phone: string | null
  phoneType?: string | null
  message: string
  status?: string | null
  isPending?: boolean
  onSend: () => void
}) {
  if (phoneType === 'landline') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-amber-500 opacity-70 cursor-not-allowed"
        disabled
        title="This is a landline number — it cannot receive WhatsApp messages."
      >
        <MessageCircle className="h-3 w-3" />
        Landline — no WhatsApp
      </Button>
    )
  }

  if (!phone) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-muted-foreground opacity-50 cursor-not-allowed"
        disabled
        title="No phone number available for WhatsApp"
      >
        <MessageCircle className="h-3 w-3" />
        <span className="hidden sm:inline">Send on </span>WhatsApp
      </Button>
    )
  }

  if (status === 'SENDING' || isPending) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-amber-400"
        disabled
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Sending...
      </Button>
    )
  }

  if (status === 'DELIVERED') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-emerald-400"
        disabled
        title="WhatsApp message delivered"
      >
        <Check className="h-3 w-3" />
        Delivered
      </Button>
    )
  }

  if (status === 'READ') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-emerald-400"
        disabled
        title="WhatsApp message read"
      >
        <Check className="h-3 w-3" />
        Read
      </Button>
    )
  }

  if (status === 'SENT') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-emerald-400"
        disabled
        title="WhatsApp message sent"
      >
        <Check className="h-3 w-3" />
        Sent
      </Button>
    )
  }

  if (status === 'FAILED') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-red-400 hover:text-red-300"
        onClick={onSend}
        title="Previous WhatsApp send failed. Click to retry."
      >
        <MessageCircle className="h-3 w-3" />
        Retry WhatsApp
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
      onClick={onSend}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <MessageCircle className="h-3 w-3" />
          <span className="hidden sm:inline">Send on </span>WhatsApp
        </>
      )}
    </Button>
  )
}

export function LeadDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const businessId = parseInt(id!)

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessesApi.get(businessId),
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', businessId],
    queryFn: () => messagesApi.list(businessId),
  })

  useEffect(() => {
  const latestStatus = messages?.[0]?.status

  if (latestStatus !== 'SENDING') {
    return
  }

  const interval = setInterval(() => {
    queryClient.invalidateQueries({
      queryKey: ['messages', businessId],
    })

    queryClient.invalidateQueries({
      queryKey: ['business', businessId],
    })
  }, 2000)

  return () => clearInterval(interval)
}, [messages?.[0]?.status, businessId, queryClient])

  const [notes, setNotes] = useState<string>('')
  const [notesChanged, setNotesChanged] = useState(false)
  const [generatingType, setGeneratingType] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: (data: BusinessUpdate) => businessesApi.update(businessId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['business', businessId], updated)
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast({ title: 'Saved' })
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  })

  const checkMutation = useMutation({
    mutationFn: () => businessesApi.checkWebsite(businessId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['business', businessId], updated)
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      toast({ title: `Website is ${updated.website_status.toLowerCase().replace('_', ' ')}` })
    },
    onError: () => toast({ title: 'Check failed', variant: 'destructive' }),
  })

  const generateMutation = useMutation({
    mutationFn: ({ promptType = 'initial', platform = 'whatsapp' }: { promptType?: string, platform?: string }) => 
      messagesApi.generate(businessId, promptType, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', businessId] })
      toast({ title: 'Message generated' })
    },
    onError: () => toast({ title: 'Generation failed', variant: 'destructive' }),
    onSettled: () => setGeneratingType(null),
  })


  const sendMutation = useMutation({
  mutationFn: () => messagesApi.send(businessId),

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['messages', businessId] })
    queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    queryClient.invalidateQueries({ queryKey: ['businesses'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })

    toast({
      title: 'WhatsApp message sent',
      description: 'Waiting for delivery status...',
    })
  },

  onError: (error: any) => {
    const detail =
      error?.response?.data?.detail ||
      'WhatsApp message failed to send'

    toast({
      title: 'WhatsApp send failed',
      description: detail,
      variant: 'destructive',
    })

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
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (!business) return null

  const currentNotes = notesChanged ? notes : (business.notes ?? '')

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      {/* Header */}
      <div className="sticky top-0 z-50 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">{business.name}</h1>
            <p className="text-sm text-muted-foreground">{business.category || 'No category'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <WebsiteStatusBadge status={business.website_status} />
          <LeadStatusBadge status={business.lead_status} />
          {/* {business.lead_status === 'CONTACTED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <Check className="h-3 w-3" /> Sent
            </span>
          )} */}
          <Button
            variant="ghost"
            size="icon"
            disabled={deleteMutation.isPending}
            className="ml-auto sm:ml-0 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete "${business.name}"?`)) deleteMutation.mutate()
            }}
          >
            {deleteMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 grid-cols-1">
        {/* Left column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                { icon: Phone, label: 'Phone', key: 'phone' as const, placeholder: '+91 98765 43210' },
                { icon: Globe, label: 'Website', key: 'website' as const, placeholder: 'https://example.com' },
                { icon: MapPin, label: 'Address', key: 'address' as const, placeholder: 'MG Road, Bangalore' },
              ].map(({ icon: Icon, label, key, placeholder }) => (
                <div key={key} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3 w-3" /> {label}
                    </Label>
                    {key === 'website' && business.website && (
                      <a
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                        title="Open website in new tab"
                      >
                        <ExternalLink className="h-3 w-3" /> Open Link
                      </a>
                    )}
                    {key === 'phone' && business.phone && business.phone_type === 'landline' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium" title="Landline — cannot receive WhatsApp">
                        ⚠ Landline (no WhatsApp)
                      </span>
                    )}
                    {key === 'phone' && business.phone && business.phone_type === 'mobile' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium" title="Mobile — can receive WhatsApp">
                        ✓ Mobile
                      </span>
                    )}
                  </div>
                  <Input
                    defaultValue={business[key] ?? ''}
                    placeholder={placeholder}
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      if (e.target.value !== (business[key] ?? '')) {
                        updateMutation.mutate({ [key]: e.target.value })
                      }
                    }}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" /> Rating
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    defaultValue={business.rating ?? ''}
                    placeholder="4.2"
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      if (val !== business.rating) {
                        updateMutation.mutate({ rating: val ?? undefined })
                      }
                    }}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Reviews</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={business.review_count ?? ''}
                    placeholder="128"
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null
                      if (val !== business.review_count) {
                        updateMutation.mutate({ review_count: val ?? undefined })
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Textarea
                placeholder="Add notes about this lead..."
                className="min-h-24 resize-none text-sm"
                value={currentNotes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setNotesChanged(true)
                }}
              />
              {notesChanged && (
                <Button
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="ml-auto h-7 text-xs gap-1.5"
                  onClick={() => {
                    updateMutation.mutate({ notes: currentNotes })
                    setNotesChanged(false)
                  }}
                >
                  {updateMutation.isPending
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                    : 'Save Notes'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* CRM */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Lead Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={business.lead_status}
                  disabled={updateMutation.isPending}
                  onValueChange={(val) => updateMutation.mutate({ lead_status: val })}
                >
                  <SelectTrigger>
                    {updateMutation.isPending
                      ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
                      : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Next Follow-up</Label>
                <Input
                  type="date"
                  className="h-9"
                  disabled={updateMutation.isPending}
                  value={business.next_followup_date ? business.next_followup_date.split('T')[0] : ''}
                  onChange={(e) => {
                    const dateVal = e.target.value ? new Date(e.target.value).toISOString() : null;
                    updateMutation.mutate({ next_followup_date: dateVal });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Website Checker */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Website Status</CardTitle>
                <WebsiteStatusBadge status={business.website_status} />
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={checkMutation.isPending}
                onClick={() => checkMutation.mutate()}
              >
                {checkMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5" /> Analyze Website</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Message Generator */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-sm">AI Outreach Messages</CardTitle>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap sm:justify-end">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 sm:h-8 text-xs w-full sm:w-auto sm:min-w-[100px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('wa_initial'); generateMutation.mutate({ promptType: 'initial', platform: 'whatsapp' }); }}
                  >
                    {generatingType === 'wa_initial' ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="h-3.5 w-3.5 mr-1.5" /> WA Initial</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 sm:h-8 text-xs w-full sm:w-auto sm:min-w-[110px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('wa_demo'); generateMutation.mutate({ promptType: 'send_demo', platform: 'whatsapp' }); }}
                  >
                    {generatingType === 'wa_demo' ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                    ) : (
                      "WA Send Demo"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-8 text-xs w-full sm:w-auto sm:min-w-[110px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('wa_followup'); generateMutation.mutate({ promptType: 'follow_up', platform: 'whatsapp' }); }}
                  >
                    {generatingType === 'wa_followup' ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                    ) : (
                      "WA Follow-up"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-8 text-xs w-full sm:w-auto sm:min-w-[100px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('wa_budget'); generateMutation.mutate({ promptType: 'objection_budget', platform: 'whatsapp' }); }}
                  >
                    {generatingType === 'wa_budget' ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                    ) : (
                      "WA Budget"
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap sm:justify-end">
                  <span className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:mr-1">Other:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-7 text-xs px-2 text-muted-foreground w-full sm:w-auto sm:min-w-[90px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('email'); generateMutation.mutate({ promptType: 'initial', platform: 'email' }); }}
                  >
                    {generatingType === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Gen. Email"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 sm:h-7 text-xs px-2 text-muted-foreground w-full sm:w-auto sm:min-w-[80px]"
                    disabled={generateMutation.isPending}
                    onClick={() => { setGeneratingType('sms'); generateMutation.mutate({ promptType: 'initial', platform: 'sms' }); }}
                  >
                    {generatingType === 'sms' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Gen. SMS"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {messagesLoading && <Skeleton className="h-32 w-full" />}
            {!messagesLoading && (!messages || messages.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Click Generate to create personalized outreach messages.
              </p>
            )}
            {messages && messages.length > 0 && (
              <div className="space-y-4">
                {(() => {
                  const latest = messages[0]
                  const parsed = parseMessage(latest.generated_message)
                  return (
                    <>
                      {parsed.whatsapp && (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                WhatsApp
                              </span>
                              {business.lead_status === 'CONTACTED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                  <Check className="h-3 w-3" /> Sent
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              <CopyButton text={parsed.whatsapp} />
                              <WhatsAppButton
  phone={business.phone}
  phoneType={business.phone_type}
  message={parsed.whatsapp}
  status={latest.status}
  isPending={sendMutation.isPending}
  onSend={() => sendMutation.mutate()}
/>
                              {/* {business.lead_status !== 'CONTACTED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={updateMutation.isPending}
                                  className="h-7 gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                                  onClick={() => updateMutation.mutate({ lead_status: 'CONTACTED' })}
                                >
                                  {updateMutation.isPending
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Send className="h-3 w-3" />}
                                  <span className="hidden xs:inline">Mark </span>Sent
                                </Button>
                              )} */}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-line">{parsed.whatsapp}</p>
                        </div>
                      )}
                      {parsed.sms && (
                        <>
                          {parsed.whatsapp && <Separator />}
                          <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                SMS
                              </span>
                              <CopyButton text={parsed.sms} />
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{parsed.sms}</p>
                          </div>
                        </>
                      )}
                      
                      {parsed.email_subject && parsed.email_body && (
                        <>
                          <Separator />
                          <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Email
                              </span>
                              <div className="flex items-center gap-2">
                                <CopyButton text={parsed.email_subject + "\n\n" + parsed.email_body} />
                                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-blue-400 hover:text-blue-300" asChild>
                                  <a
                                    href={`mailto:?subject=${encodeURIComponent(parsed.email_subject)}&body=${encodeURIComponent(parsed.email_body)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Send className="h-3 w-3" />
                                    Send Email
                                  </a>
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold border-b border-border/50 pb-2">
                                <span className="text-muted-foreground font-normal">Subject: </span>
                                {parsed.email_subject}
                              </p>
                              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                {parsed.email_body}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}
                {messages.length > 1 && (
                  <p className="text-xs text-muted-foreground text-right">
                    {messages.length} versions generated — showing latest
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


// import { useEffect, useState } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import {
//   ArrowLeft,
//   Globe,
//   Phone,
//   MapPin,
//   Star,
//   Loader2,
//   Wand2,
//   Copy,
//   Check,
//   RefreshCw,
//   Trash2,
//   MessageCircle,
//   Send,
//   ExternalLink,
//   CalendarDays,
//   Building2,
//   Clock3,
//   AlertCircle,
//   CheckCheck,
//   CircleDot,
//   Sparkles,
// } from 'lucide-react'

// import { businessesApi, type BusinessUpdate } from '@/api/businesses'
// import { messagesApi, parseMessage } from '@/api/messages'

// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'

// import { Separator } from '@/components/ui/separator'
// import { Skeleton } from '@/components/ui/skeleton'
// import {
//   WebsiteStatusBadge,
//   LeadStatusBadge,
// } from '@/components/StatusBadge'

// import { toast } from '@/components/ui/use-toast'

// const LEAD_STATUSES = [
//   'NEW',
//   'CONTACTED',
//   'INTERESTED',
//   'WON',
//   'LOST',
// ]

// function CopyButton({ text }: { text: string }) {
//   const [copied, setCopied] = useState(false)

//   const copy = async () => {
//     await navigator.clipboard.writeText(text)
//     setCopied(true)

//     setTimeout(() => {
//       setCopied(false)
//     }, 2000)
//   }

//   return (
//     <Button
//       variant="ghost"
//       size="sm"
//       className="h-8 gap-1.5 text-xs"
//       onClick={copy}
//     >
//       {copied ? (
//         <Check className="h-3.5 w-3.5 text-emerald-400" />
//       ) : (
//         <Copy className="h-3.5 w-3.5" />
//       )}

//       {copied ? 'Copied' : 'Copy'}
//     </Button>
//   )
// }

// function WhatsAppStatus({
//   status,
// }: {
//   status?: string | null
// }) {
//   if (status === 'SENDING') {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
//         <Loader2 className="h-3 w-3 animate-spin" />
//         Sending
//       </span>
//     )
//   }

//   if (status === 'SENT') {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
//         <Check className="h-3 w-3" />
//         Sent
//       </span>
//     )
//   }

//   if (status === 'DELIVERED') {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
//         <CheckCheck className="h-3 w-3" />
//         Delivered
//       </span>
//     )
//   }

//   if (status === 'READ') {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
//         <CheckCheck className="h-3 w-3" />
//         Read
//       </span>
//     )
//   }

//   if (status === 'FAILED') {
//     return (
//       <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
//         <AlertCircle className="h-3 w-3" />
//         Failed
//       </span>
//     )
//   }

//   return (
//     <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
//       <CircleDot className="h-3 w-3" />
//       Draft
//     </span>
//   )
// }

// function WhatsAppButton({
//   phone,
//   phoneType,
//   status,
//   isPending,
//   onSend,
// }: {
//   phone: string | null
//   phoneType?: string | null
//   status?: string | null
//   isPending: boolean
//   onSend: () => void
// }) {
//   if (phoneType === 'landline') {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         disabled
//         className="h-8 gap-1.5 text-xs text-amber-500"
//         title="Landline numbers cannot receive WhatsApp messages."
//       >
//         <MessageCircle className="h-3.5 w-3.5" />
//         Landline — no WhatsApp
//       </Button>
//     )
//   }

//   if (!phone) {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         disabled
//         className="h-8 gap-1.5 text-xs"
//       >
//         <MessageCircle className="h-3.5 w-3.5" />
//         No phone number
//       </Button>
//     )
//   }

//   if (status === 'SENDING' || isPending) {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         disabled
//         className="h-8 gap-1.5 text-xs"
//       >
//         <Loader2 className="h-3.5 w-3.5 animate-spin" />
//         Sending...
//       </Button>
//     )
//   }

//   if (status === 'DELIVERED' || status === 'READ') {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         disabled
//         className="h-8 gap-1.5 text-xs text-emerald-400"
//       >
//         <CheckCheck className="h-3.5 w-3.5" />
//         {status === 'READ' ? 'Read' : 'Delivered'}
//       </Button>
//     )
//   }

//   if (status === 'SENT') {
//     return (
//       <Button
//         variant="outline"
//         size="sm"
//         disabled
//         className="h-8 gap-1.5 text-xs text-emerald-400"
//       >
//         <Check className="h-3.5 w-3.5" />
//         Sent
//       </Button>
//     )
//   }

//   if (status === 'FAILED') {
//     return (
//       <Button
//         variant="default"
//         size="sm"
//         className="h-8 gap-1.5 text-xs"
//         onClick={onSend}
//       >
//         <RefreshCw className="h-3.5 w-3.5" />
//         Retry WhatsApp
//       </Button>
//     )
//   }

//   return (
//     <Button
//       variant="default"
//       size="sm"
//       className="h-8 gap-1.5 text-xs"
//       onClick={onSend}
//       disabled={isPending}
//     >
//       <Send className="h-3.5 w-3.5" />
//       Send WhatsApp
//     </Button>
//   )
// }

// function InfoRow({
//   icon: Icon,
//   label,
//   children,
// }: {
//   icon: typeof Phone
//   label: string
//   children: React.ReactNode
// }) {
//   return (
//     <div className="flex items-start gap-3">
//       <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70">
//         <Icon className="h-3.5 w-3.5 text-muted-foreground" />
//       </div>

//       <div className="min-w-0">
//         <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
//           {label}
//         </p>
//         <div className="mt-0.5 text-sm">
//           {children}
//         </div>
//       </div>
//     </div>
//   )
// }

// export function LeadDetails() {
//   const { id } = useParams<{ id: string }>()
//   const navigate = useNavigate()
//   const queryClient = useQueryClient()

//   const businessId = Number(id)

//   const [notes, setNotes] = useState('')
//   const [notesChanged, setNotesChanged] = useState(false)
//   const [generatingType, setGeneratingType] = useState<string | null>(null)

//   const {
//     data: business,
//     isLoading,
//   } = useQuery({
//     queryKey: ['business', businessId],
//     queryFn: () => businessesApi.get(businessId),
//   })

//   const {
//     data: messages,
//     isLoading: messagesLoading,
//   } = useQuery({
//     queryKey: ['messages', businessId],
//     queryFn: () => messagesApi.list(businessId),
//   })

//   const updateMutation = useMutation({
//     mutationFn: (data: BusinessUpdate) =>
//       businessesApi.update(businessId, data),

//     onSuccess: (updated) => {
//       queryClient.setQueryData(
//         ['business', businessId],
//         updated,
//       )

//       queryClient.invalidateQueries({
//         queryKey: ['businesses'],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['stats'],
//       })

//       toast({
//         title: 'Changes saved',
//       })
//     },

//     onError: () => {
//       toast({
//         title: 'Failed to save changes',
//         variant: 'destructive',
//       })
//     },
//   })

//   const checkMutation = useMutation({
//     mutationFn: () =>
//       businessesApi.checkWebsite(businessId),

//     onSuccess: (updated) => {
//       queryClient.setQueryData(
//         ['business', businessId],
//         updated,
//       )

//       queryClient.invalidateQueries({
//         queryKey: ['businesses'],
//       })

//       toast({
//         title: 'Website analysis complete',
//         description: `Status: ${updated.website_status
//           .toLowerCase()
//           .replace('_', ' ')}`,
//       })
//     },

//     onError: () => {
//       toast({
//         title: 'Website analysis failed',
//         variant: 'destructive',
//       })
//     },
//   })

//   const generateMutation = useMutation({
//     mutationFn: ({
//       promptType = 'initial',
//       platform = 'whatsapp',
//     }: {
//       promptType?: string
//       platform?: string
//     }) =>
//       messagesApi.generate(
//         businessId,
//         promptType,
//         platform,
//       ),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['messages', businessId],
//       })

//       toast({
//         title: 'Message generated',
//       })
//     },

//     onError: () => {
//       toast({
//         title: 'Message generation failed',
//         variant: 'destructive',
//       })
//     },

//     onSettled: () => {
//       setGeneratingType(null)
//     },
//   })

//   const sendMutation = useMutation({
//     mutationFn: () =>
//       messagesApi.send(businessId),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['messages', businessId],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['business', businessId],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['businesses'],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['stats'],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['analytics'],
//       })

//       toast({
//         title: 'WhatsApp message sent',
//         description: 'Waiting for delivery confirmation...',
//       })
//     },

//     onError: (error: any) => {
//       queryClient.invalidateQueries({
//         queryKey: ['messages', businessId],
//       })

//       const detail =
//         error?.response?.data?.detail ||
//         'WhatsApp message failed to send.'

//       toast({
//         title: 'WhatsApp send failed',
//         description: detail,
//         variant: 'destructive',
//       })
//     },
//   })

//   const deleteMutation = useMutation({
//     mutationFn: () =>
//       businessesApi.delete(businessId),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['businesses'],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['stats'],
//       })

//       navigate('/leads')
//     },
//   })

//   /*
//    * Evolution webhook updates the database asynchronously.
//    *
//    * While a message is SENDING, refresh every 2 seconds so the
//    * UI moves from:
//    *
//    * SENDING → SENT → DELIVERED → READ
//    */
//   useEffect(() => {
//     const latestStatus = messages?.[0]?.status

//     if (latestStatus !== 'SENDING') {
//       return
//     }

//     const interval = window.setInterval(() => {
//       queryClient.invalidateQueries({
//         queryKey: ['messages', businessId],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['business', businessId],
//       })

//       queryClient.invalidateQueries({
//         queryKey: ['businesses'],
//       })
//     }, 2000)

//     return () => {
//       window.clearInterval(interval)
//     }
//   }, [
//     messages?.[0]?.status,
//     businessId,
//     queryClient,
//   ])

//   if (isLoading) {
//     return (
//       <div className="mx-auto max-w-6xl p-4 sm:p-8">
//         <Skeleton className="mb-6 h-8 w-52" />

//         <div className="grid gap-4 lg:grid-cols-3">
//           <Skeleton className="h-52 lg:col-span-2" />
//           <Skeleton className="h-52" />
//           <Skeleton className="h-72 lg:col-span-3" />
//         </div>
//       </div>
//     )
//   }

//   if (!business) {
//     return (
//       <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
//         <AlertCircle className="h-8 w-8 text-muted-foreground" />
//         <p className="text-sm text-muted-foreground">
//           Lead not found.
//         </p>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => navigate('/leads')}
//         >
//           Back to Leads
//         </Button>
//       </div>
//     )
//   }

//   const latest = messages?.[0]
//   const parsed = latest
//     ? parseMessage(latest.generated_message)
//     : null

//   const currentNotes = notesChanged
//     ? notes
//     : business.notes ?? ''

//   const whatsappStatus = latest?.status ?? 'DRAFT'

//   const isMobile =
//     business.phone_type === 'mobile'

//   return (
//     <div className="min-h-screen bg-background">
//       {/* ------------------------------------------------------- */}
//       {/* Header */}
//       {/* ------------------------------------------------------- */}

//       <div className="border-b border-border/60 bg-background/90 backdrop-blur">
//         <div className="mx-auto max-w-6xl px-4 py-4 sm:px-8">
//           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex min-w-0 items-center gap-3">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="shrink-0"
//                 onClick={() => navigate('/leads')}
//               >
//                 <ArrowLeft className="h-4 w-4" />
//               </Button>

//               <div className="min-w-0">
//                 <div className="flex items-center gap-2">
//                   <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
//                     {business.name}
//                   </h1>

//                   {business.lead_status === 'CONTACTED' && (
//                     <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 sm:inline-flex">
//                       <Check className="h-3 w-3" />
//                       Contacted
//                     </span>
//                   )}
//                 </div>

//                 <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
//                   <Building2 className="h-3 w-3" />
//                   {business.category || 'Business lead'}
//                   <span>•</span>
//                   Lead #{business.id}
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-2 pl-11 sm:pl-0">
//               <WebsiteStatusBadge
//                 status={business.website_status}
//               />

//               <LeadStatusBadge
//                 status={business.lead_status}
//               />

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 disabled={deleteMutation.isPending}
//                 className="ml-1 text-muted-foreground hover:text-destructive"
//                 onClick={() => {
//                   if (
//                     confirm(
//                       `Delete "${business.name}"?`,
//                     )
//                   ) {
//                     deleteMutation.mutate()
//                   }
//                 }}
//               >
//                 {deleteMutation.isPending ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Trash2 className="h-4 w-4" />
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ------------------------------------------------------- */}
//       {/* Main */}
//       {/* ------------------------------------------------------- */}

//       <main className="mx-auto max-w-6xl p-4 sm:p-8">
//         <div className="grid gap-6 lg:grid-cols-3">

//           {/* =================================================== */}
//           {/* LEFT / MAIN COLUMN */}
//           {/* =================================================== */}

//           <div className="space-y-6 lg:col-span-2">

//             {/* Contact Overview */}
//             <Card className="overflow-hidden border-border/70">
//               <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <CardTitle className="text-sm">
//                       Contact overview
//                     </CardTitle>

//                     <p className="mt-1 text-xs text-muted-foreground">
//                       Business information and contact details
//                     </p>
//                   </div>

//                   {isMobile && (
//                     <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
//                       <MessageCircle className="h-3 w-3" />
//                       WhatsApp ready
//                     </span>
//                   )}
//                 </div>
//               </CardHeader>

//               <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
//                 <InfoRow
//                   icon={Phone}
//                   label="Phone"
//                 >
//                   <div className="flex items-center gap-2">
//                     <Input
//                       defaultValue={business.phone ?? ''}
//                       placeholder="+91 98765 43210"
//                       className="h-8 text-sm"
//                       onBlur={(e) => {
//                         if (
//                           e.target.value !==
//                           (business.phone ?? '')
//                         ) {
//                           updateMutation.mutate({
//                             phone: e.target.value,
//                           })
//                         }
//                       }}
//                     />
//                   </div>

//                   {business.phone_type === 'landline' && (
//                     <p className="mt-1 text-[11px] text-amber-500">
//                       Landline — WhatsApp unavailable
//                     </p>
//                   )}

//                   {business.phone_type === 'mobile' && (
//                     <p className="mt-1 text-[11px] text-emerald-500">
//                       Mobile — WhatsApp available
//                     </p>
//                   )}
//                 </InfoRow>

//                 <InfoRow
//                   icon={Globe}
//                   label="Website"
//                 >
//                   <div className="flex items-center gap-2">
//                     <Input
//                       defaultValue={business.website ?? ''}
//                       placeholder="https://example.com"
//                       className="h-8 text-sm"
//                       onBlur={(e) => {
//                         if (
//                           e.target.value !==
//                           (business.website ?? '')
//                         ) {
//                           updateMutation.mutate({
//                             website: e.target.value,
//                           })
//                         }
//                       }}
//                     />

//                     {business.website && (
//                       <a
//                         href={
//                           business.website.startsWith(
//                             'http',
//                           )
//                             ? business.website
//                             : `https://${business.website}`
//                         }
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="shrink-0 text-muted-foreground hover:text-foreground"
//                         title="Open website"
//                       >
//                         <ExternalLink className="h-4 w-4" />
//                       </a>
//                     )}
//                   </div>
//                 </InfoRow>

//                 <InfoRow
//                   icon={MapPin}
//                   label="Address"
//                 >
//                   <Input
//                     defaultValue={business.address ?? ''}
//                     placeholder="MG Road, Mumbai"
//                     className="h-8 text-sm"
//                     onBlur={(e) => {
//                       if (
//                         e.target.value !==
//                         (business.address ?? '')
//                       ) {
//                         updateMutation.mutate({
//                           address: e.target.value,
//                         })
//                       }
//                     }}
//                   />
//                 </InfoRow>

//                 <InfoRow
//                   icon={Star}
//                   label="Rating"
//                 >
//                   <div className="flex items-center gap-3">
//                     <Input
//                       type="number"
//                       min="1"
//                       max="5"
//                       step="0.1"
//                       defaultValue={business.rating ?? ''}
//                       placeholder="4.5"
//                       className="h-8 w-24 text-sm"
//                       onBlur={(e) => {
//                         const val = e.target.value
//                           ? parseFloat(e.target.value)
//                           : null

//                         if (val !== business.rating) {
//                           updateMutation.mutate({
//                             rating:
//                               val ?? undefined,
//                           })
//                         }
//                       }}
//                     />

//                     <span className="text-xs text-muted-foreground">
//                       {business.review_count ?? 0}{' '}
//                       reviews
//                     </span>
//                   </div>
//                 </InfoRow>
//               </CardContent>
//             </Card>

//             {/* ================================================= */}
//             {/* AI OUTREACH */}
//             {/* ================================================= */}

//             <Card className="overflow-hidden border-border/70">
//               <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-background to-background">
//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
//                         <Sparkles className="h-4 w-4 text-primary" />
//                       </div>

//                       <div>
//                         <CardTitle className="text-sm">
//                           AI outreach
//                         </CardTitle>

//                         <p className="text-xs text-muted-foreground">
//                           Generate personalized messages for this lead
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-2 sm:flex">
//                     <Button
//                       size="sm"
//                       variant="default"
//                       disabled={generateMutation.isPending}
//                       onClick={() => {
//                         setGeneratingType('initial')
//                         generateMutation.mutate({
//                           promptType: 'initial',
//                           platform: 'whatsapp',
//                         })
//                       }}
//                     >
//                       {generatingType === 'initial' ? (
//                         <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                       ) : (
//                         <Wand2 className="mr-1.5 h-3.5 w-3.5" />
//                       )}
//                       WA Initial
//                     </Button>

//                     <Button
//                       size="sm"
//                       variant="outline"
//                       disabled={generateMutation.isPending}
//                       onClick={() => {
//                         setGeneratingType('follow_up')
//                         generateMutation.mutate({
//                           promptType: 'follow_up',
//                           platform: 'whatsapp',
//                         })
//                       }}
//                     >
//                       {generatingType === 'follow_up' ? (
//                         <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                       ) : null}
//                       Follow-up
//                     </Button>

//                     <Button
//                       size="sm"
//                       variant="outline"
//                       disabled={generateMutation.isPending}
//                       onClick={() => {
//                         setGeneratingType('send_demo')
//                         generateMutation.mutate({
//                           promptType: 'send_demo',
//                           platform: 'whatsapp',
//                         })
//                       }}
//                     >
//                       {generatingType === 'send_demo' ? (
//                         <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                       ) : null}
//                       Demo
//                     </Button>

//                     <Button
//                       size="sm"
//                       variant="outline"
//                       disabled={generateMutation.isPending}
//                       onClick={() => {
//                         setGeneratingType('objection_budget')
//                         generateMutation.mutate({
//                           promptType: 'objection_budget',
//                           platform: 'whatsapp',
//                         })
//                       }}
//                     >
//                       {generatingType === 'objection_budget' ? (
//                         <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                       ) : null}
//                       Budget
//                     </Button>
//                   </div>
//                 </div>
//               </CardHeader>

//               <CardContent className="p-5">
//                 {messagesLoading && (
//                   <Skeleton className="h-48 w-full rounded-xl" />
//                 )}

//                 {!messagesLoading &&
//                   (!messages ||
//                     messages.length === 0) && (
//                     <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
//                       <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
//                         <Sparkles className="h-5 w-5 text-primary" />
//                       </div>

//                       <h3 className="text-sm font-medium">
//                         No outreach message yet
//                       </h3>

//                       <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
//                         Generate an AI-powered WhatsApp message using the options above.
//                       </p>
//                     </div>
//                   )}

//                 {parsed?.whatsapp && latest && (
//                   <div className="overflow-hidden rounded-xl border border-border bg-muted/20">

//                     {/* Message header */}
//                     <div className="flex flex-col gap-3 border-b border-border/60 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
//                           <MessageCircle className="h-4 w-4 text-emerald-400" />
//                         </div>

//                         <div>
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm font-medium">
//                               WhatsApp
//                             </span>

//                             <WhatsAppStatus
//                               status={whatsappStatus}
//                             />
//                           </div>

//                           <p className="mt-0.5 text-[11px] text-muted-foreground">
//                             {latest.provider
//                               ? `via ${latest.provider}`
//                               : 'Ready to send'}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-1.5">
//                         <CopyButton
//                           text={parsed.whatsapp}
//                         />

//                         <WhatsAppButton
//                           phone={business.phone}
//                           phoneType={business.phone_type}
//                           status={whatsappStatus}
//                           isPending={sendMutation.isPending}
//                           onSend={() =>
//                             sendMutation.mutate()
//                           }
//                         />
//                       </div>
//                     </div>

//                     {/* Message body */}
//                     <div className="p-5">
//                       <div className="rounded-lg border border-border/50 bg-background p-4">
//                         <p className="whitespace-pre-line text-sm leading-7 text-foreground">
//                           {parsed.whatsapp}
//                         </p>
//                       </div>
//                     </div>

//                     {/* Delivery metadata */}
//                     {(latest.status ||
//                       latest.provider_message_id ||
//                       latest.sent_at ||
//                       latest.error_message) && (
//                       <div className="border-t border-border/50 bg-muted/10 px-5 py-3">
//                         <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">

//                           {latest.status && (
//                             <span className="flex items-center gap-1.5">
//                               <CircleDot className="h-3 w-3" />
//                               Status:
//                               <strong className="font-medium text-foreground">
//                                 {latest.status}
//                               </strong>
//                             </span>
//                           )}

//                           {latest.provider_message_id && (
//                             <span className="flex items-center gap-1.5">
//                               Provider ID:
//                               <span className="max-w-[180px] truncate font-mono">
//                                 {latest.provider_message_id}
//                               </span>
//                             </span>
//                           )}

//                           {latest.sent_at && (
//                             <span className="flex items-center gap-1.5">
//                               <Clock3 className="h-3 w-3" />
//                               {new Date(
//                                 latest.sent_at,
//                               ).toLocaleString()}
//                             </span>
//                           )}
//                         </div>

//                         {latest.error_message && (
//                           <div className="mt-2 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-2.5 text-xs text-red-400">
//                             <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
//                             <span>
//                               {latest.error_message}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* Other generated channels */}
//                 {parsed?.sms && (
//                   <>
//                     <Separator className="my-5" />

//                     <div className="rounded-xl border border-border bg-muted/20 p-4">
//                       <div className="mb-2 flex items-center justify-between">
//                         <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                           SMS
//                         </span>

//                         <CopyButton text={parsed.sms} />
//                       </div>

//                       <p className="whitespace-pre-line text-sm leading-relaxed">
//                         {parsed.sms}
//                       </p>
//                     </div>
//                   </>
//                 )}

//                 {parsed?.email_subject &&
//                   parsed?.email_body && (
//                     <>
//                       <Separator className="my-5" />

//                       <div className="rounded-xl border border-border bg-muted/20 p-4">
//                         <div className="mb-3 flex items-center justify-between">
//                           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                             Email
//                           </span>

//                           <div className="flex items-center gap-1">
//                             <CopyButton
//                               text={`${parsed.email_subject}\n\n${parsed.email_body}`}
//                             />

//                             <Button
//                               variant="outline"
//                               size="sm"
//                               className="h-8 text-xs"
//                               asChild
//                             >
//                               <a
//                                 href={`mailto:?subject=${encodeURIComponent(
//                                   parsed.email_subject,
//                                 )}&body=${encodeURIComponent(
//                                   parsed.email_body,
//                                 )}`}
//                               >
//                                 <Send className="mr-1.5 h-3.5 w-3.5" />
//                                 Email
//                               </a>
//                             </Button>
//                           </div>
//                         </div>

//                         <p className="mb-2 border-b border-border/50 pb-2 text-sm font-medium">
//                           {parsed.email_subject}
//                         </p>

//                         <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
//                           {parsed.email_body}
//                         </p>
//                       </div>
//                     </>
//                   )}

//                 {messages &&
//                   messages.length > 1 && (
//                     <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
//                       <span>
//                         {messages.length} generated versions
//                       </span>

//                       <span>
//                         Showing latest
//                       </span>
//                     </div>
//                   )}
//               </CardContent>
//             </Card>

//             {/* ================================================= */}
//             {/* NOTES */}
//             {/* ================================================= */}

//             <Card className="border-border/70">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <CardTitle className="text-sm">
//                       Notes
//                     </CardTitle>

//                     <p className="mt-1 text-xs text-muted-foreground">
//                       Internal notes about this lead
//                     </p>
//                   </div>

//                   <Clock3 className="h-4 w-4 text-muted-foreground" />
//                 </div>
//               </CardHeader>

//               <CardContent>
//                 <Textarea
//                   placeholder="Add notes about this lead..."
//                   className="min-h-28 resize-none text-sm leading-relaxed"
//                   value={currentNotes}
//                   onChange={(e) => {
//                     setNotes(e.target.value)
//                     setNotesChanged(true)
//                   }}
//                 />

//                 {notesChanged && (
//                   <div className="mt-3 flex justify-end">
//                     <Button
//                       size="sm"
//                       disabled={updateMutation.isPending}
//                       onClick={() => {
//                         updateMutation.mutate({
//                           notes: currentNotes,
//                         })

//                         setNotesChanged(false)
//                       }}
//                     >
//                       {updateMutation.isPending ? (
//                         <>
//                           <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                           Saving...
//                         </>
//                       ) : (
//                         'Save Notes'
//                       )}
//                     </Button>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* =================================================== */}
//           {/* RIGHT SIDEBAR */}
//           {/* =================================================== */}

//           <div className="space-y-6">

//             {/* CRM */}
//             <Card className="border-border/70">
//               <CardHeader>
//                 <CardTitle className="text-sm">
//                   CRM
//                 </CardTitle>

//                 <p className="text-xs text-muted-foreground">
//                   Manage the lead lifecycle
//                 </p>
//               </CardHeader>

//               <CardContent className="space-y-5">
//                 <div className="space-y-2">
//                   <Label className="text-xs text-muted-foreground">
//                     Lead status
//                   </Label>

//                   <Select
//                     value={business.lead_status}
//                     disabled={updateMutation.isPending}
//                     onValueChange={(val) =>
//                       updateMutation.mutate({
//                         lead_status: val,
//                       })
//                     }
//                   >
//                     <SelectTrigger>
//                       {updateMutation.isPending ? (
//                         <span className="flex items-center gap-2 text-muted-foreground">
//                           <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                           Saving...
//                         </span>
//                       ) : (
//                         <SelectValue />
//                       )}
//                     </SelectTrigger>

//                     <SelectContent>
//                       {LEAD_STATUSES.map((status) => (
//                         <SelectItem
//                           key={status}
//                           value={status}
//                         >
//                           {status}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
//                   <div className="flex items-center gap-2">
//                     {business.lead_status ===
//                     'CONTACTED' ? (
//                       <CheckCheck className="h-4 w-4 text-emerald-400" />
//                     ) : (
//                       <CircleDot className="h-4 w-4 text-muted-foreground" />
//                     )}

//                     <div>
//                       <p className="text-xs font-medium">
//                         Outreach status
//                       </p>

//                       <p className="text-[11px] text-muted-foreground">
//                         {business.lead_status ===
//                         'CONTACTED'
//                           ? 'Lead has been contacted successfully.'
//                           : 'No successful outreach recorded yet.'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
//                     <CalendarDays className="h-3.5 w-3.5" />
//                     Next follow-up
//                   </Label>

//                   <Input
//                     type="date"
//                     className="h-9"
//                     disabled={
//                       updateMutation.isPending
//                     }
//                     value={
//                       business.next_followup_date
//                         ? business.next_followup_date.split(
//                             'T',
//                           )[0]
//                         : ''
//                     }
//                     onChange={(e) => {
//                       const dateVal = e.target.value
//                         ? new Date(
//                             e.target.value,
//                           ).toISOString()
//                         : null

//                       updateMutation.mutate({
//                         next_followup_date: dateVal,
//                       })
//                     }}
//                   />
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Website Intelligence */}
//             <Card className="border-border/70">
//               <CardHeader>
//                 <div className="flex items-center justify-between gap-3">
//                   <div>
//                     <CardTitle className="text-sm">
//                       Website intelligence
//                     </CardTitle>

//                     <p className="mt-1 text-xs text-muted-foreground">
//                       Website health for this lead
//                     </p>
//                   </div>

//                   <WebsiteStatusBadge
//                     status={business.website_status}
//                   />
//                 </div>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 {business.website ? (
//                   <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
//                     <div className="flex items-start gap-2">
//                       <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

//                       <div className="min-w-0">
//                         <p className="truncate text-xs font-medium">
//                           {business.website}
//                         </p>

//                         <a
//                           href={
//                             business.website.startsWith(
//                               'http',
//                             )
//                               ? business.website
//                               : `https://${business.website}`
//                           }
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
//                         >
//                           Open website
//                           <ExternalLink className="h-3 w-3" />
//                         </a>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="rounded-lg border border-dashed border-border p-4 text-center">
//                     <Globe className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />

//                     <p className="text-xs text-muted-foreground">
//                       No website available
//                     </p>
//                   </div>
//                 )}

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="w-full"
//                   disabled={checkMutation.isPending}
//                   onClick={() =>
//                     checkMutation.mutate()
//                   }
//                 >
//                   {checkMutation.isPending ? (
//                     <>
//                       <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
//                       Analyzing...
//                     </>
//                   ) : (
//                     <>
//                       <RefreshCw className="mr-2 h-3.5 w-3.5" />
//                       Analyze Website
//                     </>
//                   )}
//                 </Button>
//               </CardContent>
//             </Card>

//             {/* Lead snapshot */}
//             <Card className="border-border/70">
//               <CardHeader>
//                 <CardTitle className="text-sm">
//                   Lead snapshot
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-muted-foreground">
//                     Rating
//                   </span>

//                   <span className="flex items-center gap-1 text-sm font-medium">
//                     <Star className="h-3.5 w-3.5 fill-current" />
//                     {business.rating ?? '—'}
//                   </span>
//                 </div>

//                 <Separator />

//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-muted-foreground">
//                     Reviews
//                   </span>

//                   <span className="text-sm font-medium">
//                     {business.review_count ?? 0}
//                   </span>
//                 </div>

//                 <Separator />

//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-muted-foreground">
//                     Phone type
//                   </span>

//                   <span className="text-sm font-medium capitalize">
//                     {business.phone_type ??
//                       'unknown'}
//                   </span>
//                 </div>

//                 <Separator />

//                 <div className="flex items-center justify-between">
//                   <span className="text-xs text-muted-foreground">
//                     Created
//                   </span>

//                   <span className="text-xs font-medium">
//                     {new Date(
//                       business.created_at,
//                     ).toLocaleDateString()}
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }