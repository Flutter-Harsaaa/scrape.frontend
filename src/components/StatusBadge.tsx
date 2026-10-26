import { Badge } from './ui/badge'

export function WebsiteStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'WORKING':
      return <Badge variant="success">Working</Badge>
    case 'BROKEN':
      return <Badge variant="destructive">Broken</Badge>
    case 'NO_WEBSITE':
      return <Badge variant="warning">No Website</Badge>
    default:
      return <Badge variant="secondary">Unchecked</Badge>
  }
}

export function LeadStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'NEW':
      return <Badge variant="secondary">New</Badge>
    case 'CONTACTED':
      return <Badge variant="info">Contacted</Badge>
    case 'CALL_CONNECTED':
      return <Badge variant="info">Call Connected</Badge>
    case 'INTERESTED':
      return <Badge variant="purple">Interested</Badge>
    case 'WON':
      return <Badge variant="success">Won</Badge>
    case 'LOST':
      return <Badge variant="outline">Lost</Badge>
    case 'INVALID_CONTACT':
      return <Badge variant="destructive">Invalid Contact</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
