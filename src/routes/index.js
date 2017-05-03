import Router from 'koa-router'
import indexCtrl from '../controllers/indexCtrl'
import {
  getBundleJsCtrl,
  getBundleHtmlCtrl,
  getCtrl,
  newCtrl,
  editCtrl,
  getComboUrlCtrl,
  issuesCtrl,
  forkCtrl
} from '../controllers/apiCtrl'

const router = Router()

router.get('/bundle/:uuid/bundle.js', getBundleJsCtrl)
router.get('/bundle/:uuid/bundle.html', getBundleHtmlCtrl)
router.get('/api/playground/combourl', getComboUrlCtrl)
router.post('/api/playground/new', newCtrl)
router.get('/api/playground/:uuid/fork', forkCtrl)
router.get('/api/playground/:uuid', getCtrl)
router.post('/api/playground/:uuid', editCtrl)
router.get('/api/github/issues', issuesCtrl)
router.get('*', indexCtrl)

export default router
