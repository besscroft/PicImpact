import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import file from '~/hono/file'
import images from '~/hono/images'
import albums from '~/hono/albums'
import openList from '~/hono/storage/open-list.ts'
import daily from '~/hono/daily'
import tasks from '~/hono/tasks'
import preprocessTasks from '~/hono/preprocess-tasks'
import backup from '~/hono/backup'
import { HTTPException } from 'hono/http-exception'
import { sessionMiddleware } from '~/hono/_lib/context'

const route = new Hono()

route.use('*', sessionMiddleware)

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err)
    return c.json({ code: err.status, message: err.message }, err.status)
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
route.route('/tasks', tasks)
route.route('/preprocess-tasks', preprocessTasks)
route.route('/backup', backup)

export default route
