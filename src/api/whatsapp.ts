import api from './client'

export interface WhatsAppStatus {
  instance_name: string
  state: string
  evolution_response?: unknown
}

export interface WhatsAppConversation {
  id: number
  business_id: number
  business_name: string | null
  phone_number: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  is_archived: boolean
  lead_status: string | null
}

export interface WhatsAppMessage {
  id: number
  provider_message_id: string
  direction: 'incoming' | 'outgoing'
  message_type: string
  content: string
  status: string
  message_timestamp: string | null
  created_at: string | null
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await api.get('/whatsapp/status')
  return response.data
}

export async function getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  const response = await api.get('/whatsapp/conversations')
  return response.data
}

export async function getWhatsAppMessages(
  conversationId: number
): Promise<WhatsAppMessage[]> {
  const response = await api.get(
    `/whatsapp/conversations/${conversationId}/messages`
  )
  return response.data
}

export async function sendWhatsAppMessage(
  conversationId: number,
  text: string
): Promise<WhatsAppMessage> {
  const response = await api.post(
    `/whatsapp/conversations/${conversationId}/messages`,
    { text }
  )
  return response.data
}

export interface WhatsAppConnection {
  instance?: {
    instanceName?: string
    state?: string
  }
  code?: string
  pairingCode?: string
  base64?: string
  qrcode?: {
    code?: string
    base64?: string
  }
  [key: string]: unknown
}

export async function getWhatsAppConnection() {
  const response = await api.get<WhatsAppConnection>(
    '/whatsapp/connection'
  )
  return response.data
}

export async function disconnectWhatsApp() {
  const response = await api.delete(
    '/whatsapp/connection'
  )
  return response.data
}

export interface FirstWhatsAppMessageResponse {
  conversation: WhatsAppConversation
  message: WhatsAppMessage
}

export async function sendFirstWhatsAppMessage(
  businessId: number,
  text: string,
): Promise<FirstWhatsAppMessageResponse> {
  const response = await api.post<FirstWhatsAppMessageResponse>(
    `/whatsapp/leads/${businessId}/messages`,
    { text },
  )

  return response.data
}