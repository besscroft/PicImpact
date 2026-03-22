import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import file from '~/hono/file'
import images from '~/hono/images'
import albums from '~/hono/albums'
import openList from '~/hono/storage/open-list.ts'
import daily from '~/hono/daily'
import { HTTPException } from 'hono/http-exception'

const route = new Hono()

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err)
    return err.getResponse()
  }
  console.error('Unexpected error:', err)
  return c.json({ code: 500, message: 'Internal Server Error' }, 500)
})

route.route('/settings', settings)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/open-list', openList)
route.route('/daily', daily)

export default route
