import api from './client'

export interface WhatsAppStatus {
  instanceName: string
  state: string
}

export interface WhatsAppStatusResponse {
  status: string
  evolution_status_code: number
  evolution_response: {
    instance: WhatsAppStatus
  }
}

export async function getWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  const response = await api.get('/test/evolution')
  return response.data
}