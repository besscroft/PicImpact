import { Card, CardBody, CardHeader } from '@nextui-org/card'
import FileUpload from '~/components/admin/upload/FileUpload'
import { Button } from '@nextui-org/react'

export default function Upload() {


  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600 select-none">上传</h4>
            </div>
          </div>
          <Button
            color="primary"
            radius="full"
            size="sm"
          >
            提交
          </Button>
        </CardHeader>
      </Card>
      <Card className="flex-1">
        <CardBody>
          <FileUpload />
        </CardBody>
      </Card>
    </div>
  )
}