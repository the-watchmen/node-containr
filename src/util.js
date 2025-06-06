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
  isDisallowed,
  _execa,
  strip,
  _dbg,
  format,
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

function isDisallowed({out, disallowedOut}) {
  let _out = strip(out)
  if (_.isEmpty(_out)) {
    return false
  }

  if (_.isEmpty(disallowedOut)) {
    return false
  }

  _out = _.isArray(_out) ? _out : [_out]

  // note, this will return true for a partial match
  // eg: if 'no' is allowed, 'nope' will fail, so b judicious about use
  //
  return _.some(_out, (e) => {
    const some = _.some(disallowedOut, (e2) => e.includes(e2))
    if (some) {
      dbg(
        'is-disallowed: returning true because out=[%s] is in disallowed-out=%o',
        e,
        disallowedOut,
      )
      if (_out.length > 1) {
        dbg('other out(s):\n%s', pretty(_.filter(_out, (e3) => e3 !== e)))
      }
    }

    return some
  })
}

function isAllowed({error, allowedErrors}) {
  let _error = strip(error)
  if (_.isEmpty(_error)) {
    return true
  }

  if (_.isEmpty(allowedErrors)) {
    return false
  }

  _error = _.isArray(_error) ? _error : [_error]

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

async function _execa({
  cmd,
  input,
  throwOnError = true,
  allowedErrors,
  isSilentOut,
  isSilentErr,
}) {
  _dbg({key: 'exec: cmd', value: cmd})
  _dbg({key: 'exec: in', value: input})

  const result = await execa({
    lines: true,
    shell: true,
    input: Array.isArray(input) ? input.join(`\n`) : input,
    // https://github.com/sindresorhus/execa/blob/main/docs/errors.md
    //
    reject: false,
  })`${cmd}`

  const {stdout, stderr} = result
  if (isSilentOut && stdout) {
    dbg('supressing stdout...')
  } else {
    _dbg({key: 'exec: out', value: stdout})
  }

  if (isSilentErr && stderr) {
    dbg('suppressing stderr...')
  } else {
    _dbg({key: 'exec: err', value: stderr})
  }

  if (throwOnError && !isAllowed({error: stderr, allowedErrors})) {
    throw new Error(stderr)
  }

  return throwOnError ? normalize(stdout) : result
}

function normalize(val) {
  return _.isArray(val) && _.size(val) === 1 ? val[0] : val
}

function strip(val) {
  if (_.isEmpty(val)) {
    return null
  }

  if (_.isArray(val)) {
    let _val = _.map(val, (e) => (e ? e.trim() : e))
    _val = _.filter(_val, (e) => e && !_.isEmpty(e))
    return _.isEmpty(_val) ? null : _val
  }

  const _val = val.trim()
  return _.isEmpty(_val) ? null : _val
}

function format(val) {
  let _val = strip(val)

  if (_.isArray(_val)) {
    if (_val.length === 1) {
      _val = _val[0]
    } else {
      return `${pretty(_val)}`
    }
  }

  return _val && `[${_val}]`
}

function _dbg({key, value}) {
  const _value = format(value)

  if (!_.isEmpty(_value)) {
    dbg(`${key}=%s`, _value)
  }
}
