import { defineSitemapEventHandler, type SitemapUrlInput } from '#sitemap/server'
import { useEventService } from '#server/utils/event-service'

export default defineSitemapEventHandler(async (event) => {
  const service = await useEventService(event)
  const events = await service.getAllEvents({ withDraft: false })

  return [
    { loc: '/' },
    ...events.map((e) => ({ loc: `/e/${e.slug}` })),
  ] satisfies SitemapUrlInput[]
})
