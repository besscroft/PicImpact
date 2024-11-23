'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function FileUploadHelpSheet() {
  const {uploadHelp, setUploadHelp} = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={uploadHelp}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setUploadHelp(false)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide">
        <SheetHeader>
          <SheetTitle>帮助</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>
              您在当前页面可以上传图片。
            </p>
            <p>
              <b>单文件上传模式：</b>
              选择好存储和相册后，选择文件或拖入文件到上传框，会自动上传文件到对应的存储。
              同时以 0.2 倍率压缩为 webp 格式，生成一张预览用的图片。
              同时上传完毕后，您可以编辑图片的一些信息，最后点击保存入库。
            </p>
            <p>
              <b>LivePhoto 上传模式：</b>
              根据 Apple 官方文档描述：LivePhotos 由两部分组成：一张静态照片和一段拍摄前后瞬间的视频。
              所以，您需要将 LivePhoto 导出为一个 JPG（或 HEIC） 文件和一个 MOV 文件，并分别上传。
            </p>
            <p>
              <b>多文件上传模式：</b>
              选择好存储和相册后，选择文件或拖入文件到上传框，会自动上传文件到对应的存储。
              多文件上传模式下，无法在数据入库之前进行编辑，多文件上传属于全自动化上传，无需手动入库。
              上传队列最大支持 5 个，上传完毕后您可以将图片从上传队列中删除。
              重置按钮会重置存储和相册等数据。
            </p>
            <p>
              注：文件上传时，会自动获取图片的宽高，请您勿随意更改，否则可能导致前端展示错位。
              非必填项您可以在图片数据入库后，去图片维护里面进行编辑。
            </p>
            <p>
              注：部分云平台，限制了上传请求的主体大小，比如 Vercel 的免费用户限制 6M。
            </p>
            <p>
              如您有更多疑问欢迎反馈！
            </p>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}