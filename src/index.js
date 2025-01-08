import assert from 'node:assert'
import {execa} from 'execa'
import debug from '@watchmen/debug'
import config from 'config'
import _ from 'lodash'
import {toParams} from './util.js'

const dbg = debug(import.meta.url)

export {withImage, withImages, withContainer}

async function withImage({
  image,
  env = {},
  volumes = {},
  user,
  command = '',
  input,
  isLines = false,
  isShell = true,
  work = config.work.local,
}) {
  dbg(
    'with-image: image=%o, env=%o, work=%o, volumes=%o, user=%o, command=%o, input=%o, is-lines=%o, is-shell=%o',
    image,
    env,
    work,
    volumes,
    user,
    command,
    input,
    isLines,
    isShell,
  )

  const _image = getImageName(image)
  assert(_image, 'image name required')

  if (image.hasShell === false) {
    assert(_.every([command, !input]))
  } else {
    assert(_.every([input, !command]))
  }

  const _volumes = getVolumes({work, volumes})
  const _user = user ? `--user ${user}` : ''

  dbg('with-image: _volumes=%o, user=%o', _volumes, _user)

  const cmd = `docker run --rm --interactive ${toEnv(env)} ${toVolumes(_volumes)} ${_user} ${_image} ${command}`
  dbg('with-image: cmd=%o', cmd)

  const result = await execa({
    lines: isLines,
    shell: isShell,
    input: Array.isArray(input) ? input.join(`\n`) : input,
  })`${cmd}`
  dbg('out=%o, err=%o', result.stdout, result.stderr)
  return result
}

async function withContainer({
  container,
  env = {},
  input,
  isLines = false,
  isShell = true,
}) {
  dbg(
    'with-container: container=%o, env=%o, input=%o, is-lines=%o, is-shell=%o',
    container,
    env,
    input,
    isLines,
    isShell,
  )

  assert(container, 'container required')

  const cmd = `docker exec --interactive ${toEnv(env)} ${container} /bin/sh`
  dbg('with-container: cmd=%o', cmd)

  const result = await execa({
    lines: isLines,
    shell: isShell,
    input: Array.isArray(input) ? input.join(`\n`) : input,
  })`${cmd}`
  dbg('out=%o, err=%o', result.stdout, result.stderr)
  return result
}

async function withImages({
  images,
  env = {},
  volumes = {},
  work = config.work.local,
  closure,
}) {
  assert(_.size(images), 'images required')
  assert(
    !_.some(images, ['hasShell', false]),
    'invalid use of image without shell',
  )
  assert(
    _.every(images, (v) => getImageName(v)),
    'image name required',
  )
  assert(closure, 'closure required')

  const _volumes = getVolumes({work, volumes})

  dbg(
    'with-images: images=%o, env=%o, work=%o, _volumes=%o',
    images,
    env,
    work,
    _volumes,
  )

  const containers = {}

  await Promise.all(
    _.map(images, async (v, k) => {
      const _image = getImageName(v)
      const __volumes = {..._volumes, ...v.volumes}
      const cmd = `docker run --rm ${toEnv(env)} ${toVolumes(__volumes)} -dit ${_image} /bin/sh`
      dbg('with-images: cmd=%o', cmd)
      const {stdout} = await execa({
        shell: true,
      })`${cmd}`
      containers[k] = stdout.slice(0, 12)
    }),
  )

  dbg('with-images: started containers=%o', containers)

  await closure(containers)

  await Promise.all(
    _.map(_.values(containers), (v) => {
      return execa({})`docker rm --force ${v}`
    }),
  )

  dbg('with-images: removed containers=%o', containers)
}

function toEnv(map) {
  return toParams({map, param: '--env'})
}

function toVolumes(map) {
  return toParams({map: _.invert(map), param: '--volume', separator: ':'})
}

function getWork(work) {
  return work.startsWith('/') ? work : `${process.cwd()}/${work}`
}

function getVolumes({work, volumes}) {
  return {
    [`/${config.work.container}`]: getWork(work),
    ...volumes,
  }
}

function getImageName(image) {
  return _.isString(image) ? image : image.name
}
