import Router from 'koa-router'
import indexCtrl from '../controllers/indexCtrl'
import {
  getBundleJsCtrl,
  getCtrl,
  newCtrl,
  editCtrl,
  getComboUrlCtrl,
  issuesCtrl
} from '../controllers/apiCtrl'

const router = Router()

router.get('/bundle/:uuid/bundle.js', getBundleJsCtrl)
router.get('/api/playground/combourl', getComboUrlCtrl)
router.post('/api/playground/new', newCtrl)
router.get('/api/playground/:uuid', getCtrl)
router.post('/api/playground/:uuid', editCtrl)
router.get('/api/github/issues', issuesCtrl)
router.get('*', indexCtrl)

export default router
