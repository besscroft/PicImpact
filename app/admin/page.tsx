import { getCurrentUser } from '~/server/lib/user'
import { Card, CardBody } from '@nextui-org/card'

export default async function Admin() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardBody>
          <p>
            {user ?
              <div>
                <p>控制台（已登录）</p>
              </div>
              :
              '控制台（未登录）'
            }
          </p>
        </CardBody>
      </Card>
      <Card className="flex-1">
        <CardBody>
          <p>
            <p>{JSON.stringify(user)}</p>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}