import { useRuntimeConfig } from 'nuxt/app'

export const useSiteName = () => {
  const config = useRuntimeConfig()
  return config.public.siteName
}
