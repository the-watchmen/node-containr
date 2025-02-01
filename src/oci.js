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
    input: `oras pull --output ${getContainerWork()} ${image}`,
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
    input: `oras push ${toParams({map: annotations, param: '--annotation'})} ${image} ${targets.join(' ')} `,
    volumes,
    user,
  })
}

function getOrasImage() {
  return getConfig({
    path: 'images.oras',
    dflt: {
      name: 'ghcr.io/oras-project/oras:v1.2.2',
      entrypoint: '/bin/sh',
    },
  })
}
