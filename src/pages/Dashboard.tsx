import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Globe,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Trophy,
  ArrowUpRight,
  Users,
  Phone,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

import { businessesApi } from '@/api/businesses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const statCards = [
  {
    key: 'total',
    label: 'Total Leads',
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'hover:border-blue-500/30',
    link: '/leads',
  },
  {
    key: 'no_website',
    label: 'No Website',
    icon: WifiOff,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'hover:border-amber-500/30',
    link: '/leads?website_status=NO_WEBSITE',
  },
  {
    key: 'broken_website',
    label: 'Broken Website',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'hover:border-red-500/30',
    link: '/leads?website_status=BROKEN',
  },
  {
    key: 'contacted',
    label: 'Contacted',
    icon: MessageSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'hover:border-purple-500/30',
    link: '/leads?lead_status=CONTACTED',
  },
  {
    key: 'interested',
    label: 'Interested',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'hover:border-emerald-500/30',
    link: '/leads?lead_status=INTERESTED',
  },
  {
    key: 'won',
    label: 'Won',
    icon: Trophy,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'hover:border-yellow-500/30',
    link: '/leads?lead_status=WON',
  },
] as const

const COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  yellow: '#eab308',
  slate: '#64748b',
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: COLORS.blue,
  CONTACTED: COLORS.purple,
  INTERESTED: COLORS.emerald,
  WON: COLORS.yellow,
  LOST: COLORS.red,
}

const WEBSITE_STATUS_COLORS: Record<string, string> = {
  'No Website': COLORS.amber,
  Working: COLORS.emerald,
  Broken: COLORS.red,
  Unchecked: COLORS.slate,
}

const CATEGORY_COLORS = [
  COLORS.blue,
  COLORS.emerald,
  COLORS.purple,
  COLORS.amber,
  COLORS.red,
  COLORS.yellow,
]

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 10,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
}

const axisTick = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground))',
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  icon?: typeof Users
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`overflow-hidden border-border/70 ${className}`}>
      <CardHeader className="border-b border-border/50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">
              {title}
            </CardTitle>

            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {children}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: businessesApi.stats,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: businessesApi.analytics,
  })

  const leadStatus = (analytics?.lead_status ?? []).filter(
    (d) => d.value > 0
  )

  const websiteStatus = (analytics?.website_status ?? []).filter(
    (d) => d.value > 0
  )

  const phoneType = (analytics?.phone_type ?? []).filter(
    (d) => d.value > 0
  )

  const funnelMax = analytics?.funnel?.[0]?.value || 1

  const totalLeads = stats?.total ?? 0
  const contacted = stats?.contacted ?? 0
  const interested = stats?.interested ?? 0
  const won = stats?.won ?? 0

  const contactRate =
    totalLeads > 0
      ? Math.round((contacted / totalLeads) * 100)
      : 0

  const interestedRate =
    totalLeads > 0
      ? Math.round((interested / totalLeads) * 100)
      : 0

  const wonRate =
    totalLeads > 0
      ? Math.round((won / totalLeads) * 100)
      : 0

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Pipeline overview
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Monitor your leads, outreach activity and conversion pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Messages generated
              </p>

              <p className="text-sm font-semibold">
                {analyticsLoading ? (
                  <span className="inline-block h-4 w-10 animate-pulse rounded bg-muted" />
                ) : (
                  analytics?.messages_sent ?? 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map(
            ({
              key,
              label,
              icon: Icon,
              color,
              bg,
              border,
              link,
            }) => (
              <Link to={link} key={key} className="group">
                <Card
                  className={`h-full border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/20 hover:shadow-sm ${border}`}
                >
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>

                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
                    </div>

                    <div className="mt-4">
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {label}
                      </p>

                      <div className="mt-1.5">
                        {statsLoading ? (
                          <Skeleton className="h-7 w-14" />
                        ) : (
                          <p className="text-2xl font-bold tracking-tight">
                            {stats?.[
                              key as keyof typeof stats
                            ] ?? 0}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>

        {/* Pipeline summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PipelineMetric
            label="Contact rate"
            value={contactRate}
            color="bg-purple-500"
            loading={statsLoading}
          />

          <PipelineMetric
            label="Interested rate"
            value={interestedRate}
            color="bg-emerald-500"
            loading={statsLoading}
          />

          <PipelineMetric
            label="Won rate"
            value={wonRate}
            color="bg-yellow-500"
            loading={statsLoading}
          />
        </div>

        {/* Lead growth */}
        <div className="mt-5 sm:mt-6">
          <ChartCard
            title="Lead Growth"
            subtitle="Cumulative leads added over time"
            icon={TrendingUp}
          >
            {analyticsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={analytics?.leads_over_time ?? []}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -18,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="leadGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={COLORS.emerald}
                        stopOpacity={0.32}
                      />

                      <stop
                        offset="100%"
                        stopColor={COLORS.emerald}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d: string) => d.slice(5)}
                    minTickGap={20}
                  />

                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={40}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Total leads"
                    stroke={COLORS.emerald}
                    strokeWidth={2.5}
                    fill="url(#leadGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Status charts */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Lead Status"
            subtitle="Where your leads are in the sales pipeline"
            icon={Users}
          >
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : leadStatus.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leadStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {leadStatus.map((d) => (
                      <Cell
                        key={d.name}
                        fill={
                          LEAD_STATUS_COLORS[d.name] ??
                          COLORS.slate
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 12,
                      paddingTop: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Website Status"
            subtitle="Identify businesses with website opportunities"
            icon={Globe}
          >
            {analyticsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : websiteStatus.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={websiteStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {websiteStatus.map((d) => (
                      <Cell
                        key={d.name}
                        fill={
                          WEBSITE_STATUS_COLORS[d.name] ??
                          COLORS.slate
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip contentStyle={tooltipStyle} />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 12,
                      paddingTop: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Funnel + categories */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Conversion Funnel"
            subtitle="Progress from lead discovery to closed business"
            icon={TrendingUp}
          >
            {analyticsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <div className="space-y-5 py-2">
                {(analytics?.funnel ?? []).map((step, i) => {
                  const pct = Math.round(
                    (step.value / funnelMax) * 100
                  )

                  const colors = [
                    COLORS.blue,
                    COLORS.purple,
                    COLORS.emerald,
                    COLORS.yellow,
                  ]

                  return (
                    <div key={step.name}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-muted-foreground">
                          {step.name}
                        </span>

                        <span className="text-xs font-semibold">
                          {step.value}
                          <span className="ml-1 font-normal text-muted-foreground">
                            ({pct}%)
                          </span>
                        </span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: colors[i],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {(analytics?.funnel ?? []).length === 0 && (
                  <EmptyChart />
                )}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Top Categories"
            subtitle="Most common business types in your database"
            icon={Users}
          >
            {analyticsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (analytics?.top_categories?.length ?? 0) === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(
                  200,
                  (analytics?.top_categories.length ?? 0) * 38
                )}
              >
                <BarChart
                  data={analytics?.top_categories ?? []}
                  layout="vertical"
                  margin={{
                    top: 0,
                    right: 16,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={105}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{
                      fill: 'hsl(var(--accent))',
                      opacity: 0.3,
                    }}
                  />

                  <Bar
                    dataKey="value"
                    name="Leads"
                    radius={[0, 5, 5, 0]}
                    barSize={18}
                  >
                    {(analytics?.top_categories ?? []).map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CATEGORY_COLORS[
                              i % CATEGORY_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Phone reachability */}
        <div className="mt-5">
          <ChartCard
            title="Phone Reachability"
            subtitle="Mobile numbers can receive WhatsApp; landlines cannot"
            icon={Phone}
          >
            {analyticsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : phoneType.length === 0 ? (
              <EmptyChart />
            ) : (
              <PhoneBar data={phoneType} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

function PipelineMetric({
  label,
  value,
  color,
  loading,
}: {
  label: string
  value: number
  color: string
  loading: boolean
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {label}
            </p>

            {loading ? (
              <Skeleton className="mt-2 h-6 w-12" />
            ) : (
              <p className="mt-1 text-lg font-bold">{value}%</p>
            )}
          </div>

          <div className="h-8 w-8 rounded-full bg-muted/60 p-2">
            <div
              className={`h-full w-full rounded-full ${color}`}
            />
          </div>
        </div>

        {!loading && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PhoneBar({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const total =
    data.reduce((sum, item) => sum + item.value, 0) || 1

  const colorFor: Record<string, string> = {
    Mobile: COLORS.emerald,
    Landline: COLORS.amber,
    Unknown: COLORS.slate,
  }

  return (
    <div className="py-2">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {data.map((item) => (
          <div
            key={item.name}
            style={{
              width: `${(item.value / total) * 100}%`,
              background:
                colorFor[item.name] ?? COLORS.slate,
            }}
            title={`${item.name}: ${item.value}`}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background:
                  colorFor[item.name] ?? COLORS.slate,
              }}
            />

            <span className="text-muted-foreground">
              {item.name}
            </span>

            <span className="font-semibold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      No data yet
    </div>
  )
}