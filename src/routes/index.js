import Router from 'koa-router'
import indexCtrl from '../controllers/indexCtrl'
import {
  getBundleJsCtrl,
  getCtrl,
  newCtrl,
  editCtrl,
  getComboUrlCtrl
} from '../controllers/apiCtrl'

const router = Router()

router.get('/bundle/:uuid/bundle.js', getBundleJsCtrl)
router.post('/api/playground/new', newCtrl)
router.get('/api/playground/edit', editCtrl)
router.get('/api/playground/combourl', getComboUrlCtrl)
router.get('/api/playground/:uuid', getCtrl)
router.get('*', indexCtrl)

export default router
