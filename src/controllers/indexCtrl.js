import requsest from 'request-promise'

const CONFIG_URL = 'http://onawbsyg7.bkt.clouddn.com/rax.json'
let configCache = null
let configTimeout = 0
// timeout is 5 minutes
async function getRemoteVersion(timeout = 5 * 60 * 1000) {
  let result = '';
  if (configTimeout < Date.now()) {
    const remoteConfig = await requsest(CONFIG_URL, { json: true })
    if (remoteConfig && remoteConfig.assetsVersion) {
      result = remoteConfig.assetsVersion
      configCache = remoteConfig
      configTimeout = Date.now() + timeout
    }
  } else {
    result = configCache.assetsVersion
  }
  return result;
}

export default async (ctx, next) => {
  const { version, type } = ctx.query;
  // need to change
  let assetsVersion = version || '0.1.0'
  if (version === undefined) {
    assetsVersion = await getRemoteVersion() || assetsVersion;
  }
  const basePath = type || 'site-external'
  const assetsPath = `//g.alicdn.com/raxjs/rax-site-assets/${assetsVersion}/${basePath}`;

  await ctx.render('index', {
    assetsPath
  })
}
