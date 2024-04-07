import { Card, CardBody } from '@nextui-org/card'

export default async function List() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardBody>
          <p>
            图片维护
          </p>
        </CardBody>
      </Card>
      <Card className="flex-1">
        <CardBody>
          <p>
            图片维护页面
          </p>
        </CardBody>
      </Card>
    </div>
  )
}