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
  filterError,
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

function filterError({result, whitelist}) {
  // [
  //   "Unable to find image 'debian:bookworm-slim' locally",
  //   'bookworm-slim: Pulling from library/debian',
  //   'fd674058ff8f: Pulling fs layer',
  //   'fd674058ff8f: Verifying Checksum',
  //   'fd674058ff8f: Download complete',
  //   'fd674058ff8f: Pull complete',
  //   'Digest: sha256:d365f4920711a9074c4bcd178e8f457ee59250426441ab2a5f8106ed8fe948eb',
  //   'Status: Downloaded newer image for debian:bookworm-slim'
  // ]
  _.some(whitelist, (v) => {
    if (includes(result.stderr, v)) {
      dbg('filtering error for target=%s', v)
      result.stderr = []
    }
  })

  return result
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

  _error = _.filter(_error, (e) => !_.isEmpty(e.trim()))

  // note, this will return true for a partial match
  // eg: if 'no' is allowed, 'nope' will pass, so b judicious about use
  //
  return _.every(_error, (e) => _.some(allowedErrors, (e2) => e.includes(e2)))
}
