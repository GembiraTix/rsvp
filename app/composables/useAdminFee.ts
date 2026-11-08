export function useAdminFee(
  eventId: MaybeRefOrGetter<number>,
  subtotal: MaybeRefOrGetter<number>,
) {
  return useFetch<{ success: boolean; data: { admin_fee: number } }>(
    () => `/api/events/${toValue(eventId)}/admin-fee?subtotal=${toValue(subtotal)}`,
  )
}
