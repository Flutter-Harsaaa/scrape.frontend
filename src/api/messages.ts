import api from './client'

export interface Message {
  id: number
  business_id: number
  generated_message: string
  channel: string | null
  status: string | null
  provider: string | null
  provider_message_id: string | null
  sent_at: string | null
  error_message: string | null
  created_at: string
}

export interface ParsedMessage {
  whatsapp: string
  sms: string
  email_subject: string
  email_body: string
}

export const messagesApi = {
  list: async (businessId: number): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(`/messages/${businessId}`)
    return data
  },

  generate: async (
    businessId: number,
    prompt_type: string = 'initial',
    platform: string = 'whatsapp'
  ): Promise<Message> => {
    const { data } = await api.post<Message>('/messages', {
      business_id: businessId,
      prompt_type,
      platform,
    })
    return data
  },

  send: async (businessId: number): Promise<Message> => {
    const { data } = await api.post<Message>(
      `/messages/${businessId}/send`
    )
    return data
  },
}

export function parseMessage(generatedMessage: string): ParsedMessage {
  try {
    const parsed = JSON.parse(generatedMessage)

    return {
      whatsapp: parsed.whatsapp || '',
      sms: parsed.sms || '',
      email_subject: parsed.email_subject || '',
      email_body: parsed.email_body || '',
    }
  } catch (e) {
    return {
      whatsapp: generatedMessage,
      sms: '',
      email_subject: '',
      email_body: '',
    }
  }
}