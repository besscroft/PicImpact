import { Card, CardBody } from '@nextui-org/card'
import FileUpload from '~/components/FileUpload'

export default async function Upload() {

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardBody>
          <p>
            上传
          </p>
        </CardBody>
      </Card>
      <Card className="flex-1">
        <CardBody>
          <FileUpload />
        </CardBody>
      </Card>
    </div>
  )
}