export function useAdminSettings() {
  function fetchPaymentSettings() {
    return useFetch<{ success: boolean; data: { admin_fee: number } }>(
      '/api/admin/settings/payment',
    )
  }

  async function updatePaymentSettings(adminFee: number) {
    return $fetch<{ success: boolean; data: { admin_fee: number } }>(
      '/api/admin/settings/payment',
      {
        method: 'PUT',
        body: { admin_fee: adminFee },
      },
    )
  }

  return { fetchPaymentSettings, updatePaymentSettings }
}
