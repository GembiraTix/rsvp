export default defineEventHandler(async (event) => {
  const { auth } = event.context
  if (!auth.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Pengguna tidak terautentikasi.',
    })
  }

  const orderService = await useOrderService(event)
  const orders = await orderService.findByUser(auth.user.sub)

  return { success: true, data: orders }
})
