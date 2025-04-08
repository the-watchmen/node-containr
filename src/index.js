import assert from 'node:assert'
import {execa} from 'execa'
import debug from '@watchmen/debug'
import _ from 'lodash'
import {
  getContainerWork,
  getImageName,
  getVolumes,
  toEntry,
  toEnv,
  toVolumes,
  toWorkdir,
  toUser,
  _execa,
} from './util.js'

const dbg = debug(import.meta.url)

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
  const entry = toEntry(image.entrypoint)

  dbg(
    'with-image: _volumes=%o, user=%o, entry=%s',
    _volumes,
    user,
    image.entrypoint,
  )

  const work = getContainerWork()

  const cmd = `docker run --rm --interactive ${entry} ${toEnv(env)} ${toVolumes(_volumes)} ${toWorkdir(work)} ${toUser(user)} ${_image} ${command}`
  dbg('with-image: cmd=%o', cmd)

  return _execa({
    throwOnError: false,
    lines: isLines,
    shell: isShell,
    input: Array.isArray(input) ? input.join(`\n`) : input,
    cmd,
    allowedErrors: ['Downloaded newer'],
  })
}

async function withContainer({
  container,
  env,
  input,
  throwOnError,
  user,
  workdir,
  allowedErrors,
}) {
  assert(container, 'container required')
  const _user = user ? `--user ${user}` : ''
  const cmd = `docker exec --interactive ${_user} ${toEnv(env)} ${toWorkdir(workdir)} ${container} /bin/sh`
  dbg('with-container: cmd=%o', cmd)

  return _execa({
    throwOnError,
    allowedErrors,
    lines: true,
    shell: true,
    input: Array.isArray(input) ? input.join(`\n`) : input,
    // https://github.com/sindresorhus/execa/blob/main/docs/errors.md
    //
    reject: false,
    cmd,
  })
}

async function withImages({images, env = {}, volumes = {}, user, closure}) {
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

  dbg(
    'with-images: images=%o, env=%o, _volumes=%o, user=%s',
    images,
    env,
    _volumes,
    user,
  )

  const containers = {}

  await Promise.all(
    _.map(images, async (v, k) => {
      const _image = getImageName(v)
      const __volumes = {..._volumes, ...v.volumes}
      const _env = {...env, ...v.env}
      const entry = toEntry(v.entrypoint)
      const _cmd = entry ? '' : '/bin/sh'
      const work = getContainerWork()

      const cmd = `docker run --rm ${toEnv(_env)} ${toVolumes(__volumes)} ${toWorkdir(work)} -dit ${entry} ${toUser(user)} ${_image} ${_cmd}`
      dbg('with-images: cmd=%o', cmd)
      const {stdout} = await execa({
        shell: true,
      })`${cmd}`
      containers[k] = stdout.slice(0, 12)
    }),
  )

  dbg('with-images: started containers=%o', containers)

  const result = await closure(
    ({image, input, env = {}, throwOnError = true, allowedErrors = []}) => {
      dbg(
        'with-container: image=%o, env=%o, input=%o, throw-on-error=%o, allowed-errors=%o',
        image,
        env,
        input,
        throwOnError,
        allowedErrors,
      )
      return withContainer({
        container: containers[image],
        env,
        input,
        throwOnError,
        allowedErrors,
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
