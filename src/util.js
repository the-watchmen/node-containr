import assert from 'node:assert'
import debug from '@watchmen/debug'
import {parseBoolean, pretty} from '@watchmen/helpr'
import config from 'config'
import fs from 'fs-extra'
import _ from 'lodash'
import {execa} from 'execa'

const dbg = debug(import.meta.url)

export {
  initWork,
  toFlag,
  toFlags,
  getUid,
  getHostWork,
  getContainerWork,
  includes,
  getConfig,
  toEnv,
  toVolumes,
  getVolumes,
  getImageName,
  toUser,
  toWorkdir,
  toEntry,
  isContainer,
  isAllowed,
  _execa,
}

const git = '.git'

async function initWork() {
  const _isContainer = await isContainer()
  dbg('init-work: is-container=%o', _isContainer)
  const dir = _isContainer ? getContainerWork() : getHostWork()

  if (isInitWork()) {
    if (fs.existsSync(`${dir}/${git}`)) {
      dbg(`init-work: work has ${git}, skipping initialization`)
    } else {
      dbg('init-work: creating/clearing work dir=%s', dir)
      await fs.emptyDir(dir)
      const {stdout} = await execa({lines: true})`ls -laR ${dir}`
      dbg('init-work=%s', pretty(stdout))
    }
  } else {
    dbg(
      'init-work: attempt to initialize work=%s, but is-init-work not set, ignoring...',
      dir,
    )
  }
}

function toFlag({flag, val}) {
  return val ? `--${flag} ${val}` : ''
}

function toFlags({map, flag, separator = '='}) {
  return _.map(map, (v, k) => `--${flag} ${k}${separator}${v}`).join(' ')
}

async function getUid() {
  const {stdout, stderr} = await execa({})`id -u`
  assert(_.isEmpty(stderr), stderr)
  dbg('get-uid: uid=%s', stdout)
  return stdout
}

function isInitWork() {
  return parseBoolean(getConfig({path: 'work.isInit', dflt: false}))
}

function getHostWork() {
  return getConfig({path: 'work.host', dflt: '/tmp/containr/work'})
}

function getContainerWork() {
  return getConfig({path: 'work.container', dflt: '/tmp/containr/work'})
}

function includes(o, s) {
  return _.isArray(o)
    ? _.some(_.reverse(o), (v) => v.includes(s))
    : o.includes(s)
}

function getConfig({path, dflt = null}) {
  // foo.bar -> CONTAINR_FOO_BAR
  const toks = ['containr', ...path.split('.')]
  const env = _.snakeCase(toks.join('_')).toUpperCase()
  const _path = toks.join('.')
  const value = process.env[env] || _.get(config, _path) || dflt
  dbg('get-config: env=%s, path=%s, dflt=%s, value=%s', env, _path, dflt, value)
  return value
}

function toEnv(map) {
  return toFlags({map, flag: 'env'})
}

function toVolumes(map) {
  return toFlags({map: _.invert(map), flag: 'volume', separator: ':'})
}

function getVolumes(volumes) {
  return {
    [getContainerWork()]: getHostWork(),
    ...volumes,
  }
}

function getImageName(image) {
  return _.isString(image) ? image : image.name
}

function toUser(user) {
  return toFlag({flag: 'user', val: user})
}

function toWorkdir(dir) {
  return toFlag({flag: 'workdir', val: dir})
}

function toEntry(entry) {
  return toFlag({flag: 'entrypoint', val: entry})
}

async function isContainer() {
  return fs.exists('/.dockerenv')
}

function isAllowed({error, allowedErrors}) {
  if (_.isEmpty(error)) {
    return true
  }

  if (_.isEmpty(allowedErrors)) {
    return false
  }

  let _error = _.isArray(error) ? error : [error]

  _error = strip(_error)
  // _.filter(_error, (e) => !_.isEmpty(e.trim()))

  // note, this will return true for a partial match
  // eg: if 'no' is allowed, 'nope' will pass, so b judicious about use
  //
  return _.every(_error, (e) => {
    const some = _.some(allowedErrors, (e2) => e.includes(e2))
    if (!some) {
      dbg(
        'is-allowed: returning false because error=[%s] is not in allowed-errors=%o',
        e,
        allowedErrors,
      )
      if (_error.length > 1) {
        dbg('other error(s):\n%s', pretty(_.filter(_error, (e3) => e3 !== e)))
      }
    }

    return some
  })
}

async function _execa({cmd, input, throwOnError = true, allowedErrors}) {
  _dbg({key: 'input', value: input})
  // const _input = deepClean(input)
  // if (!_.isEmpty(_input)) {
  //   if (Array.isArray(_input)) {
  //     dbg('input=\n%s', pretty(_input))
  //   } else {
  //     dbg('input=[%s]', input)
  //   }
  // }

  const result = await execa({
    lines: true,
    shell: true,
    input: Array.isArray(input) ? input.join(`\n`) : input,
    // https://github.com/sindresorhus/execa/blob/main/docs/errors.md
    //
    reject: false,
  })`${cmd}`

  const out = strip(result.stdout)
  const err = strip(result.stderr)
  // !_.isEmpty(out) && dbg('out=\n%s', pretty(out))
  // !_.isEmpty(err) && dbg('err=\n%s', pretty(err))
  _dbg({key: 'out', value: out})
  _dbg({key: 'err', value: err})

  if (throwOnError && !isAllowed({error: err, allowedErrors})) {
    throw new Error(err)
  }

  result.stdout = _.isArray(out) && _.size(out) === 1 ? out[0] : out

  return throwOnError ? result.stdout : result
}

function strip(a) {
  return Array.isArray(a)
    ? _.filter(a, (e) => !_.isEmpty(e.trim()))
    : a && a.trim()
}

function _dbg({key, value}) {
  let _value = strip(value)
  if (!_.isEmpty(_value)) {
    if (Array.isArray(_value) && _value.size > 1) {
      dbg(`${key}=\n%s`, pretty(_value))
    } else {
      _value = Array.isArray(_value) ? _value[0] : _value
      dbg(`${key}=[%s]`, _value)
    }
  }
}
