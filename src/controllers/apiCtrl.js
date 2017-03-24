import UUID from 'uuid'
import Playground from '../models/Playground'
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

export const getCtrl = async (ctx, next) => {
  const { uuid } = ctx.params
  const data = await Playground.findOne({
    where: { uuid }
  })

  ctx.body = {
    status: 'success',
    sourceCode: data.sourceCode,
    compilerCode: data.compilerCode,
    depLibs: data.depLibs
  }
}

export const newCtrl = async (ctx, next) => {
  const { body } = ctx.request
  const uuid = UUID.v4()

  const result = await Playground.create({
    uuid: uuid,
    sourceCode: body.sourceCode,
    compilerCode: body.compilerCode,
    depLibs: body.depLibs
  })

  ctx.body = {
    status: 'success',
    uuid: result.uuid
  }
}

export const editCtrl = async (ctx, next) => {
  const uuid = ctx.query.uuid
  const body = ctx.request.body

  const data = await Playground.findOne({
    where: { uuid }
  })

  // 更新资源
  await data.update({
    sourceCode: body.sourceCode,
    compilerCode: body.compilerCode,
    depLibs: body.depLibs
  })

  ctx.body = {
    status: 'success'
  }
}

export const getComboUrlCtrl = async (ctx, next) => {
  const deps = ctx.query.deps;

  debug('getComboUrl', ctx.query)

  const comboUrl = await getComboUrl(deps)

  ctx.body = {
    status: 'success',
    comboUrl: comboUrl
  }
}
