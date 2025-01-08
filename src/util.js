import debug from '@watchmen/debug'
import config from 'config'
import fs from 'fs-extra'
import _ from 'lodash'
import {execa} from 'execa'

const dbg = debug(import.meta.url)

export {initWorkDir, toParams, getUid}

function initWorkDir() {
  fs.emptyDir(config.work.local)
}

function toParams({map, param, separator = '='}) {
  return _.map(map, (v, k) => `${param} ${k}${separator}${v}`).join(' ')
}

async function getUid() {
  const {stdout, stderr} = await execa({})`id -u`
  dbg('get-uid: out=%o, err=%o', stdout, stderr)
  return stdout
}
