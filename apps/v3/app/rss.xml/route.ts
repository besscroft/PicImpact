import 'server-only'
import RSS from 'rss'
import { cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'
import { getRSSImages } from '~/server/db/query/images'

export async function GET(request: Request) {
  const rows = await cachedConfigsByKeys([
    'custom_title',
    'custom_author',
    'rss_feed_id',
    'rss_user_id'
  ])
  const info = toCustomInfo(rows)

  const url = new URL(request.url)

  const feedId = info.rssFeedId
  const userId = info.rssUserId

  const customElements = feedId && userId
    ? [
      {
        follow_challenge: [
          { feedId: feedId },
          { userId: userId }
        ]
      }
    ]
    : []

  const feed = new RSS({
    title: info.customTitle || '相册',
    generator: 'RSS for Next.js',
    feed_url: `${url.origin}/rss.xml`,
    site_url: url.origin,
    copyright: `© 2024${new Date().getFullYear().toString() === '2024' ? '' : `-${new Date().getFullYear().toString()}`} ${info.customAuthor}.`,
    pubDate: new Date().toUTCString(),
    ttl: 60,
    custom_elements: customElements,
  })

  const images = await getRSSImages()
  if (Array.isArray(images) && images.length > 0) {
    images?.map(item => {
      feed.item({
        title: item.title || '图片',
        description: `
          <div>
            <img src="${item.preview_url || item.url}" alt="${item.detail}" />
            <p>${item.detail}</p>
            <a href="${url.origin + (item.album_value === '/' ? '/preview/' : item.album_value + '/preview/') + item.id}" target="_blank">查看图片信息</a>
          </div>
        `,
        url: url.origin + (item.album_value === '/' ? '/preview/' : item.album_value + '/preview/') + item.id,
        guid: item.id,
        date: item.created_at,
        enclosure: {
          url: item.preview_url || item.url,
          type: 'image/jpeg',
        },
        media: {
          content: {
            url: item.preview_url || item.url,
            type: 'image/jpeg',
          },
          thumbnail: {
            url: item.preview_url || item.url,
          },
        },
      })
    })
  }

  return new Response(feed.xml(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    }
  })
}