import assert from 'node:assert'
import dayjs from 'dayjs'
import debug from '@watchmen/debug'
import {parseBoolean} from '@watchmen/helpr'
import config from 'config'
import fs from 'fs-extra'
import _ from 'lodash'
import {execa} from 'execa'

const dbg = debug(import.meta.url)

const timestamp = getTimestamp()

export {
  initHostWork,
  toParams,
  getUid,
  getHostWork,
  getContainerWork,
  getHostRoot,
  includes,
  filterError,
  getConfig,
}

function getTimestamp() {
  return dayjs().format('YYYY-MM-DD.HH.mm.ss')
}

const git = '.git'

async function initHostWork() {
  const dir = getHostWork()
  dbg('init-host-work: dir=%s', dir)
  if (isWorkCwd()) {
    dbg('init-host-work: is-work-cwd, skipping initialization')
  } else if (fs.existsSync(`${dir}/${git}`)) {
    dbg(`init-host-work: work has ${git}, skipping initialization`)
  } else {
    dbg('init-host-work: creating/clearing work dir=%s', dir)
    await fs.emptyDir(dir)
  }
}

function toParams({map, param, separator = '='}) {
  return _.map(map, (v, k) => `${param} ${k}${separator}${v}`).join(' ')
}

async function getUid() {
  const {stdout, stderr} = await execa({})`id -u`
  assert(_.isEmpty(stderr), stderr)
  dbg('get-uid: uid=%s', stdout)
  return stdout
}

function getHostWork({closure} = {}) {
  const work = isWorkCwd() ? process.cwd() : `${getHostRoot()}/${timestamp}`
  if (closure) {
    closure({work})
  }

  return work
}

function isWorkCwd() {
  return parseBoolean(getConfig({path: 'work.isCwd', dflt: false}))
}

function getContainerWork() {
  return getHostRoot()
}

function getHostRoot() {
  return getConfig({path: 'work.root', dflt: '/tmp/containr/work'})
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
  dbg('get-config: env=%s, path=%s, dflt=%s', env, _path, dflt)
  return process.env[env] || _.get(config, _path) || dflt
}
