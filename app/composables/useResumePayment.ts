export function useResumePayment() {
  const { resumePayment } = useOrders()

  const resumingOrderId = ref<string | null>(null)
  const resumeErrorMessage = ref('')

  async function resume(order: { id: string }) {
    resumingOrderId.value = order.id
    resumeErrorMessage.value = ''
    try {
      const res = await resumePayment(order.id)
      await navigateTo(res.data.redirectUrl, { external: true })
    } catch (err: unknown) {
      resumeErrorMessage.value = getErrorMessage(
        err,
        'Gagal melanjutkan pembayaran.',
      )
    } finally {
      resumingOrderId.value = null
    }
  }

  return { resumingOrderId, resumeErrorMessage, resume }
}
