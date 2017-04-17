import UUID from 'uuid'
import Playground from '../models/Playground'
import request from 'request-promise'
import {
  generateBundleContent,
  getComboUrl,
  transformCompilerCode
} from '../helpers'

const debug = require('debug')('rax:playground');

export const getBundleJsCtrl = async (ctx, next) => {
  const { uuid } = ctx.params
  const data = await Playground.findOne({
    where: { uuid }
  })
  const compilerCode = transformCompilerCode(data.compilerCode);
  const jsContent = await generateBundleContent(compilerCode, data.depLibs);

  // 指定 Content-Type
  ctx.set('Content-Type', 'application/javascript')
  ctx.body = jsContent
}

export async function getBundleHtmlCtrl(ctx, next) {
  const { uuid } = ctx.params
  const data = await Playground.findOne({
    where: { uuid }
  })

  const compilerCode = transformCompilerCode(data.compilerCode)
  const comboUrl = await getComboUrl(data.depLibs, 'web')

  await ctx.render('h5-playground', {
    code: compilerCode,
    comboUrl: comboUrl
  })
}

export const getCtrl = async (ctx, next) => {
  const { uuid } = ctx.params
  const data = await Playground.findOne({
    where: { uuid }
  })

  ctx.body = {
    status: 'success',
    sourceCode: data.sourceCode,
    compilerCode: data.compilerCode,
    depLibs: data.depLibs,
    sourceCSS: data.sourceCSS
  }
}

export const newCtrl = async (ctx, next) => {
  const { body } = ctx.request
  const uuid = UUID.v4()

  const result = await Playground.create({
    uuid: uuid,
    sourceCode: body.sourceCode,
    compilerCode: body.compilerCode,
    depLibs: body.depLibs,
    sourceCSS: body.sourceCSS
  })

  ctx.body = {
    status: 'success',
    uuid: result.uuid
  }
}

export const editCtrl = async (ctx, next) => {
  const { uuid } = ctx.params
  const body = ctx.request.body

  const data = await Playground.findOne({
    where: { uuid }
  })

  // 更新资源
  await data.update({
    sourceCode: body.sourceCode,
    compilerCode: body.compilerCode,
    depLibs: body.depLibs,
    sourceCSS: body.sourceCSS
  })

  ctx.body = {
    status: 'success'
  }
}

export const getComboUrlCtrl = async (ctx, next) => {
  const deps = ctx.query.deps
  const env = ctx.query.env || 'native'
  debug('getComboUrl', ctx.query)

  const comboUrl = await getComboUrl(deps, env)

  ctx.body = {
    status: 'success',
    comboUrl: comboUrl
  }
}

const githubIssueAPICache = {};
export const issuesCtrl = async (ctx, next) => {
  const url = 'https://api.github.com/repos/alibaba/rax/issues?state=all'
  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12A365 MicroMessenger/5.4.1 NetType/WIFI'
  }
  // 强资源缓存
  if (githubIssueAPICache['etag']) {
    headers['If-None-Match'] = githubIssueAPICache['etag']
  }
  try {
    const result = await request(url, { headers, resolveWithFullResponse: true })
    ctx.set('X-RateLimit-Remaining', result.headers['X-RateLimit-Remaining'.toLowerCase()])
    ctx.set('X-RateLimit-Reset', result.headers['X-RateLimit-Reset'.toLowerCase()])
    githubIssueAPICache['etag'] = result.headers['etag']
    ctx.body = githubIssueAPICache.body = String(result.body)
  } catch(err) {
    if (/^304/.test(err.message)) {
      ctx.body = githubIssueAPICache.body
    } else {
      throw err
    }
  }
}
