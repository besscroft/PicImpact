import 'server-only'
import { Hono } from 'hono'
import settings from '~/api/settings'
import hello from '~/api/hello'
import auth from '~/api/auth'
import copyright from '~/api/copyright'
import file from '~/api/file'
import image from '~/api/image'
import tags from '~/api/tags'
import alist from '~/api/storage/alist'

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