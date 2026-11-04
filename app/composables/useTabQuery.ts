export function useTabQuery(defaultTab: string) {
  const route = useRoute()
  const router = useRouter()

  return computed({
    get() {
      const tab = route.query.tab as string
      return tab || defaultTab
    },
    set(val: string) {
      router.push({ query: { ...route.query, tab: val } })
    },
  })
}
