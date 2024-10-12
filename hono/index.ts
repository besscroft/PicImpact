import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import hello from '~/hono/hello'
import auth from '~/hono/auth'
import copyright from '~/hono/copyright'
import file from '~/hono/file'
import image from '~/hono/image'
import tags from '~/hono/tags'
import alist from '~/hono/storage/alist'

const route = new Hono()

route.route('/settings', settings)
route.route('/hello', hello)
route.route('/auth', auth)
route.route('/copyright', copyright)
route.route('/file', file)
route.route('/image', image)
route.route('/tags', tags)
route.route('/storage/alist', alist)

export default route