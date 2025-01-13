import assert from 'node:assert'
import dayjs from 'dayjs'
import debug from '@watchmen/debug'
import config from 'config'
import fs from 'fs-extra'
import _ from 'lodash'
import {execa} from 'execa'

const dbg = debug(import.meta.url)

const timestamp = getTimestamp()
await initHostWork()

export {
  initHostWork,
  toParams,
  getUid,
  getHostWork,
  getContainerWork,
  getHostRoot,
}

function getTimestamp() {
  return dayjs().format('YYYY-MM-DD.HH.mm.ss')
}

async function initHostWork() {
  const dir = getHostWork()
  dbg('init-host-work: dir=%s', dir)
  await fs.emptyDir(dir)
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

function getHostWork() {
  return `${getHostRoot()}/${timestamp}`
}

function getContainerWork() {
  return getHostRoot()
}

function getHostRoot() {
  return (
    process.env.CONTAINR_WORK_ROOT || config?.work?.root || '/tmp/containr/work'
  )
}
