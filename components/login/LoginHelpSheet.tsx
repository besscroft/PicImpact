'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function LoginHelpSheet() {
  const { loginHelp, setLoginHelp } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={loginHelp}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setLoginHelp(false)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide">
        <SheetHeader>
          <SheetTitle>帮助</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>
              忘记密码了？
            </p>
            <p className="break-words">
              将数据库中的 users 表的 password 字段的【值】【更新】为【51630b15b0cec2da9926af7015db33b7809f9d24959a0d48665b83e9d19216cd5601d08a622a8b2c48709d5bbb62eef6ae76addce5d18703b28965eef62d491b】，然后重启服务即可。
            </p>
            <p>
              注意：要是出现密码被盗或者忘记密码的情况，建议您还是更新环境变量 AUTH_SECRET 后，重启服务！
            </p>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}