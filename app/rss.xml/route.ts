import 'server-only'
import RSS from 'rss'
import { fetchCustomTitle, getRSSImages } from '~/server/db/query'

export async function GET(request: Request) {
  // const revalidate = 60 * 60 * 24;
  const data = await fetchCustomTitle()

  const url = new URL(request.url);

  // TODO
  //<follow_challenge>
  //  <feedId>feedId</feedId>
  //  <userId>userId</userId>
  //</follow_challenge>

  const feed = new RSS({
    title: data?.config_value?.toString() || 'PicImpact',
    generator: 'RSS for Next.js',
    feed_url: `${url.origin}/rss.xml`,
    site_url: url.origin,
    // TODO
    copyright: `Copyright ${new Date().getFullYear().toString()}, PicImpact`,
    pubDate: new Date().toUTCString(),
    // ttl: 60,
  });

  const images = await getRSSImages()

  if (Array.isArray(images) && images.length > 0) {
    images?.map(item => {
      feed.item({
        title: item.title || '图片',
        description: `
          <div>
            <img src="${item.preview_url || item.url}" alt="${item.detail}" />
            <p>${item.detail}</p>
            <a href={url.origin + (item.album_value === '/' ? '/preview/' : item.album_value + '/preview/') + item.id} target="_blank">查看图片信息</a>
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
      // 'Cache-Control': `s-maxage=${ revalidate }, stale-while-revalidate`
    }
  });
}