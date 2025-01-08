import assert from 'node:assert/strict'
import debug from '@watchmen/debug'
import config from 'config'
import {toParams} from './util.js'
import {withImage} from './index.js'

export {pushOci, pullOci}

const dbg = debug(import.meta.url)
const cwork = `/${config.work.container}`
const volumes = {'/tmp': '/tmp'}

function pullOci({image, work, user}) {
  assert(image, 'image required')
  dbg('pull-oci: image=%o, work=%o, user=%o', image, work, user)
  return withImage({
    image: config.images.oras,
    command: `pull --output ${cwork} ${image}`,
    work,
    volumes,
    user,
    isLines: true,
  })
}

function pushOci({image, targets, annotations = {}}) {
  assert(image, 'image required')
  assert(targets, 'targets required')
  dbg(
    'push-oci: image=%o, targets=%o, annotations=%o',
    image,
    targets,
    annotations,
  )
  return withImage({
    image: config.images.oras,
    command: `push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets} `,
    volumes,
  })
}
