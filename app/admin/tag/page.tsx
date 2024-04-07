import { Card, CardBody } from '@nextui-org/card'

export default async function List() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardBody>
          <p>
            标签管理
          </p>
        </CardBody>
      </Card>
      <Card className="flex-1">
        <CardBody>
          <p>
            标签管理页面
          </p>
        </CardBody>
      </Card>
    </div>
  )
}