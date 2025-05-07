import favicon from '~/public/favicon.svg'
import Image from 'next/image'
import Link from 'next/link'
import { fetchContributors } from '~/lib/github/get-contributors'
import { EvervaultCard, Icon } from '~/components/ui/origin/evervault-card'

export default async function About() {
  const contributors = await fetchContributors('besscroft', 'PicImpact')

  return (
    <div className="flex flex-col space-y-4 h-full flex-1 w-full mx-auto items-center p-2">
      <Link
        href="https://github.com/besscroft/PicImpact"
        target="_blank"
      >
        <Image
          className="my-4 select-none"
          src={favicon}
          alt="Logo"
          width={64}
          height={64}
        />
      </Link>
      <span className="select-none">PicImpact 是一个支持自部署的摄影作品展示网站，基于 Next.js + Hono.js 开发。</span>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 xl:gap-8">
        {
          contributors.map((item: any) => {
            return (
              <div
                key={item.login}
                className="select-none border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start w-full mx-auto p-4 relative"
              >
                <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
                <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
                <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
                <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

                <EvervaultCard text={item.avatar_url} />

                <h2 className="dark:text-white text-black mt-4 text-lg font-light">
                  {item.login}
                </h2>
                <Link
                  href={item.html_url}
                  target="_blank"
                >
                  <p className="select-none text-sm border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-4 text-black dark:text-white px-2 py-0.5">
                    Follow
                  </p>
                </Link>
              </div>
            )
          })
        }
        <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start w-full mx-auto p-4 relative">
          <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
          <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
          <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
          <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

          <EvervaultCard text="https://pic1.afdiancdn.com/default/avatar/avatar-purple.png" />

          <h2 className="dark:text-white text-black mt-4 text-lg font-light">
            欢迎通过爱发电赞助！
          </h2>
          <Link
            href="https://afdian.com/a/besscroft"
            target="_blank"
          >
            <p className="select-none text-sm border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-4 text-black dark:text-white px-2 py-0.5">
              点击赞助
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}