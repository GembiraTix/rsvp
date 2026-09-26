import { Resend } from 'resend'

let resendInstance: Resend | null = null

export function useResend(): Resend | null {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey
  if (!apiKey) {
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}
