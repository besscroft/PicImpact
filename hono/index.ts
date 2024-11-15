import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import auth from '~/hono/auth'
import copyrights from '~/hono/copyrights'
import file from '~/hono/file'
import images from '~/hono/images'
import albums from '~/hono/albums'
import alist from '~/hono/storage/alist'

const route = new Hono()

route.route('/settings', settings)
route.route('/auth', auth)
route.route('/copyrights', copyrights)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/alist', alist)

export default route