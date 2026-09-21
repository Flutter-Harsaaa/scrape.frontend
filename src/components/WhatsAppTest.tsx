import { useState } from 'react'
import { getWhatsAppStatus } from '@/api/whatsapp'

export function WhatsAppTest() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    try {
      setLoading(true)

      const data = await getWhatsAppStatus()

      setResult(
        `Evolution API: ${data.status}\n` +
        `Instance: ${data.evolution_response.instance.instanceName}\n` +
        `State: ${data.evolution_response.instance.state}`
      )
    } catch (error) {
      console.error(error)
      setResult('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <button
        onClick={testConnection}
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-white"
      >
        {loading ? 'Testing...' : 'Test WhatsApp Connection'}
      </button>

      {result && (
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4">
          {result}
        </pre>
      )}
    </div>
  )
}