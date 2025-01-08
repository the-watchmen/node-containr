import test from 'ava'
import config from 'config'
import debug from '@watchmen/debug'
import fs from 'fs-extra'
import {pushOci, pullOci} from '../../src/oci.js'
import {getUid} from '../../src/util.js'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await fs.emptyDir(config.work.local)
})

test('push-oci: basic', async (t) => {
  const file = 'scratch.txt'
  const image = 'ttl.sh/oci-scratch:1.0.0'
  const content = 'foo'
  const containerFile = `${config.work.container}/${file}`

  await fs.writeFile(`${config.work.local}/${file}`, content)

  const {stdout: push, stderr: pushError} = await pushOci({
    image,
    targets: [containerFile],
    annotations: {foo: 'bar'},
  })
  dbg('push: out=%o, err=%o', push, pushError)

  t.true(pushError.includes('Downloaded newer') || !pushError)

  const work = `${config.work.local}/pull`
  await fs.emptyDir(work)

  const user = await getUid()
  t.truthy(user)

  const {stdout: pull, stderr: pullError} = await pullOci({
    image,
    work,
    user,
  })
  dbg('pull: out=%o, err=%o', pull, pullError)
  t.true(pull[0].startsWith('Downloading'))
  t.is(await fs.readFile(`${work}/${containerFile}`, 'utf8'), content)
})
