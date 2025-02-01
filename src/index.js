import assert from 'node:assert'
import {execa} from 'execa'
import debug from '@watchmen/debug'
import _ from 'lodash'
import {toParams, getHostWork, getContainerWork, filterError} from './util.js'

const dbg = debug(import.meta.url)
const whitelist = ['Downloaded newer']

export {withImage, withImages}

async function withImage({
  image,
  env = {},
  volumes = {},
  user,
  command = '',
  input,
  isLines = false,
  isShell = true,
}) {
  dbg(
    'with-image: image=%o, env=%o, volumes=%o, user=%o, command=%o, input=%o, is-lines=%o, is-shell=%o',
    image,
    env,
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

  const _volumes = getVolumes(volumes)
  const _user = user ? `--user ${user}` : ''
  const entry = image.entrypoint ? `--entrypoint ${image.entrypoint}` : ''

  dbg('with-image: _volumes=%o, user=%o, entry=%s', _volumes, _user, entry)

  const cmd = `docker run --rm --interactive ${entry} ${toEnv(env)} ${toVolumes(_volumes)} ${getWorkDir()} ${_user} ${_image} ${command}`
  dbg('with-image: cmd=%o', cmd)

  const result = await execa({
    lines: isLines,
    shell: isShell,
    input: Array.isArray(input) ? input.join(`\n`) : input,
  })`${cmd}`
  dbg('out=%o, err=%o', result.stdout, result.stderr)
  return filterError({result, whitelist})
}

async function withContainer({container, env, input, throwOnError}) {
  assert(container, 'container required')

  const cmd = `docker exec --interactive ${getWorkDir()} ${toEnv(env)} ${container} /bin/sh`
  dbg('with-container: cmd=%o', cmd)

  const result = await execa({
    lines: true,
    shell: true,
    input: Array.isArray(input) ? input.join(`\n`) : input,
  })`${cmd}`
  dbg('out=%o, err=%o', result.stdout, result.stderr)

  if (throwOnError && !_.isEmpty(result.stderr)) {
    throw new Error(result.stderr)
  }

  result.stdout =
    _.isArray(result.stdout) && _.size(result.stdout) === 1
      ? result.stdout[0]
      : result.stdout

  return throwOnError ? result.stdout : result
}

async function withImages({images, env = {}, volumes = {}, closure}) {
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

  const _volumes = getVolumes(volumes)

  dbg('with-images: images=%o, env=%o, _volumes=%o', images, env, _volumes)

  const containers = {}

  await Promise.all(
    _.map(images, async (v, k) => {
      const _image = getImageName(v)
      const __volumes = {..._volumes, ...v.volumes}
      const entry = v.entrypoint ? `--entrypoint ${v.entrypoint}` : ''
      const _cmd = entry ? '' : '/bin/sh'

      const cmd = `docker run --rm ${toEnv(env)} ${toVolumes(__volumes)} -dit ${entry} ${_image} ${_cmd}`
      dbg('with-images: cmd=%o', cmd)
      const {stdout} = await execa({
        shell: true,
      })`${cmd}`
      containers[k] = stdout.slice(0, 12)
    }),
  )

  dbg('with-images: started containers=%o', containers)

  const result = await closure(
    ({image, input, env = {}, throwOnError = true}) => {
      dbg(
        'with-container: image=%o, env=%o, input=%o, throw-on-error=%o',
        image,
        env,
        input,
        throwOnError,
      )
      return withContainer({
        container: containers[image],
        env,
        input,
        throwOnError,
      })
    },
  )

  await Promise.all(
    _.map(_.values(containers), (v) => {
      return execa({})`docker rm --force ${v}`
    }),
  )

  dbg('with-images: removed containers=%o', containers)
  return result
}

function toEnv(map) {
  return toParams({map, param: '--env'})
}

function toVolumes(map) {
  return toParams({map: _.invert(map), param: '--volume', separator: ':'})
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

function getWorkDir() {
  return `--workdir ${getContainerWork()}`
}
