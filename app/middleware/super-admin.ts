export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo(`/login?redirectTo=${to.fullPath}`)
  }

  const role =
    user.value.app_metadata?.role || user.value.user_metadata?.role || 'user'

  if (role !== 'super_admin') {
    return navigateTo('/users')
  }
})
