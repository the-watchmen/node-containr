import assert from 'node:assert/strict'
import debug from '@watchmen/debug'
import {toParams, getContainerWork, getConfig} from './util.js'
import {withImage} from './index.js'

export {pushOci, pullOci}

const dbg = debug(import.meta.url)
const volumes = {'/tmp': '/tmp'}

function pullOci({image, user}) {
  assert(image, 'image required')
  dbg('pull-oci: image=%o, user=%o', image, user)
  return withImage({
    image: getOrasImage(),
    command: `pull --output ${getContainerWork()} ${image}`,
    volumes,
    user,
    isLines: true,
  })
}

function pushOci({image, targets, user, annotations = {}}) {
  assert(image, 'image required')
  assert(targets, 'targets required')
  dbg(
    'push-oci: image=%o, targets=%o, user=%s, annotations=%o',
    image,
    targets,
    user,
    annotations,
  )
  return withImage({
    image: getOrasImage(),
    command: `push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets} `,
    volumes,
    user,
  })
}

function getOrasImage() {
  return getConfig({path: 'images.oras', dflt: 'bitnami/oras:1.2.1'})
}
