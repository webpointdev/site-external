import request from 'request'
const debug = require('debug')('rax:bundle')

const customVersions = {
  'universal-panresponder': '0.2.3',
  'universal-env': '0.2.3'
}

export {
  getComboUrl,
  generateBundleContent,
  transformCompilerCode
}

function transformCompilerCode(compilerCode) {
  // ugly: @ali 的包 cdn 资源 define 的包名加了 npm 前缀以及 index 后缀，如 define('npm/@ali/rax-player/index')
  // 因此这块通过正则的方式将代码里的 require('@ali/xxx') 转换为 require('npm/@ali/xxx/index'), weex 不支持 index
  compilerCode = compilerCode.replace(/require\(('|")\@ali\/(.*)('|")\)/g, "require('npm/@ali/$2/index')");

  return compilerCode;
}

function generateBundleContent(compilerCode, depLibs) {
  return getComboUrl(depLibs, 'weex')
    .then(getCdnContent)
    .then((cdnContent) => {
      return comboJsContent(compilerCode, cdnContent)
    })
}

function getComboUrl(depLibs = [], env) {

  debug('getComboUrl', depLibs, env);

  if (!depLibs) {
    return null;
  } else if (!Array.isArray(depLibs)) {
    depLibs = [depLibs];
  }

  return modifyLibsInfo(depLibs)
    .then((libs) => {
      return getDeps(libs);
    })
    .then((deps) => {

      const npms = uniqDeps(deps);

      const comboPath = npms.map((npm) => {
        if (!npm.version) {
          return '';
        }

        const isTnpm = /^\@ali\//.test(npm.name);
        const filename = env === 'web' ? 'index.web.cmd.js' : (
            isTnpm ? 'index.native.cmd.js' : 'index.weex.cmd.js'
          );

        const version = customVersions[npm.name] || npm.version;
        return `${npm.name}/${version}/${filename}`;
      }).join(',');

      const comboUrl = `http://g.alicdn.com/code/npm/??${comboPath}`;

      debug('comboUrl', comboUrl);
      return comboUrl;
    });
}


function comboJsContent(compilerCode, cdnContent) {

  return `// {"framework" : "Rax"}
define("rax-playground", function(require) {
  ${cdnContent}
  ${compilerCode}
});
require("rax-playground");
  `;
}

function getCdnContent(url) {

  return new Promise((resolve, reject) => {

    if (!url) {
      return resolve('');
    }

    request.get(url, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      resolve(body);
    });
  });
}

// 完善依赖的信息
function modifyLibsInfo(deps = []) {

  const promiseQueue = deps.map((dep) => {
    return getLibVersion(dep)
      .then((version) => {
        debug('getLibVersion', dep, version);
        return {
          name: dep,
          version
        };
      });
  });

  return Promise.all(promiseQueue);
}

/**
 * 获取某个依赖的可用版本
 *
 * 可用：npm & cdn
 */
function getLibVersion(lib) {

  return new Promise((resolve, reject) => {
    request({
      url: `http://registry.npm.taobao.org/${lib}`,
      json: true
    }, (err, res, body) => {
      if (err) {
        return resolve(null);
      }

      if (body.error) {
        return resolve(null);
      }

      const versions = Object.keys(body.versions);
      let index = 0;

      function callback(checkErr, inCdn, version) {

        if (inCdn) {
          return resolve(version);
        } else {
          index ++;

          if (!versions[index] || index >= 10) {
            // 超出数组长度了
            console.error(`没有找到 ${lib} 的 cdn 资源`);
            return resolve(null);
          }

          checkCdnVersion(lib, versions[index], callback);
        }
      }

      checkCdnVersion(lib, versions[index], callback);
    });
  });
}

function checkCdnVersion(lib, version, callback) {

  const cdnUrl = `http://g.alicdn.com/code/npm/${lib}/${version}/index.cmd.js`;

  request(cdnUrl, (err, res, body) => {

    debug('checkCdnVersion', res.statusCode, cdnUrl);

    if (res.statusCode === 200) {
      return callback(null, true, version);
    } else {
      // console.error(err, res);
      return callback(null, false);
    }

  });
}

/**
 * 收集 libs 的所有依赖
 *
 * TODO
 */
function getDeps(libs) {

  const promiseQueue = libs.map((lib) => {
    return new Promise((resolve, reject) => {
      const isTnpm = /^\@ali\//.test(lib.name);
      let result = {name: lib.name, deps: []};

      if (isTnpm) {
        // 通过 deps.json 获取
        request({
          url: `http://g.alicdn.com/code/npm/${lib.name}/${lib.version}/deps.json`,
          json: true
        }, (err, res, body) => {
          const key = `npm/${lib.name}/${lib.version}/index.cmd`;
          if (body && body[key] && body[key].requires) {

            let deps = body[key].requires;
            result.deps = deps.concat(result.deps);

            // 解析依赖的依赖
            deps.forEach((dep) => {
              if (body[dep] && body[dep].requires) {
                result.deps = body[dep].requires.concat(result.deps);
              }
            });

            debug('getLibDeps success', lib, result);

            return resolve(result);
          } else {
            debug('getLibDeps fail', lib, body);
            return resolve(result);
          }
        });

      } else {
        return resolve(result);
      }
    });
  });

  return Promise
    .all(promiseQueue)
    .then((data) => {
      let result = [];
      const libToDeps = {};

      data.forEach((item) => {
        libToDeps[item.name] = item.deps;
      });

      libs.forEach((lib) => {
        const relatedLibs = libToDeps[lib.name].map((dep) => {
          return {
            // npm/@ali/rax-components/1.1.8/index.cmd
            name: dep.match(/npm\/(.*)\/\d/)[1],
            version: dep.match(/\/(\d\.\d\.\d)\//)[1]
          };
        });
        relatedLibs.push(lib);
        result = result.concat(relatedLibs);
      });
      debug('getLibsDeps success', result);
      return result;
    });
}

function uniqDeps(deps) {
  let cache = {};
  let result = [];

  debug('uniqDeps', deps);

  deps.forEach((dep) => {
    // TODO: Select a version.
    if (!cache[dep.name]) {
      cache[dep.name] = dep;
      result.push(dep);
    }
  });

  debug('uniqDeps success', result);

  return result;
}
