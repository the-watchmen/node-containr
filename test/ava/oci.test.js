import test from 'ava'
import debug from '@watchmen/debug'
import fs from 'fs-extra'
import _ from 'lodash'
import {pushOci, pullOci} from '../../src/oci.js'
import {getUid, getHostWork, initHostWork} from '../../src/util.js'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await initHostWork()
})

test('push-oci: basic', async (t) => {
  const file = 'scratch.txt'
  const image = 'ttl.sh/oci-scratch:1.0.0'
  const content = 'foo'
  const work = getHostWork()
  const _file = `${work}/${file}`
  dbg('push: writing file=%s', _file)
  await fs.writeFile(_file, content)

  const user = await getUid()
  t.truthy(user)

  const {stdout: push, stderr: pushError} = await pushOci({
    image,
    targets: [file],
    user,
    annotations: {foo: 'bar'},
  })
  dbg('push: out=%o, err=%o', push, pushError)

  t.true(pushError.includes('Downloaded newer') || !pushError)

  dbg('push: clearing work dir=%s', work)
  await initHostWork()

  const {stdout: pull, stderr: pullError} = await pullOci({
    image,
    user,
  })
  dbg('pull: out=%o, err=%o', pull, pullError)
  t.true(pull[0].startsWith('Downloading'))
  t.is(await fs.readFile(`${work}/${file}`, 'utf8'), content)
})

test('push-oci: multi', async (t) => {
  const targets = []
  let file = 'scratch.txt'
  targets.push(file)
  const image = 'ttl.sh/oci-scratch:1.0.0'
  const content = 'foo'
  const work = getHostWork()

  let _file = `${work}/${file}`
  dbg('push: writing file=%s', _file)
  await fs.writeFile(_file, content)

  file = 'scratch-2.txt'
  targets.push(file)
  _file = `${work}/${file}`
  dbg('push: writing file=%s', _file)
  await fs.writeFile(_file, content)

  const user = await getUid()
  t.truthy(user)

  const {stdout: push, stderr: pushError} = await pushOci({
    image,
    targets,
    user,
    annotations: {foo: 'bar'},
  })
  dbg('push: out=%o, err=%o', push, pushError)

  t.true(pushError.includes('Downloaded newer') || !pushError)

  dbg('push: clearing work dir=%s', work)
  await initHostWork()

  const {stdout: pull, stderr: pullError} = await pullOci({
    image,
    user,
  })
  dbg('pull: out=%o, err=%o', pull, pullError)
  t.true(pull[0].startsWith('Downloading'))
  _.each(targets, async (file) => {
    t.is(await fs.readFile(`${work}/${file}`, 'utf8'), content)
  })
})

test('push-oci: closure', async (t) => {
  const file = 'scratch.txt'
  const image = 'ttl.sh/oci-scratch:1.0.0'
  const content = 'foo'
  const work = getHostWork({
    async closure({work}) {
      dbg('closure: work=%s', work)
      t.truthy(work)
      const _file = `${work}/${file}`
      dbg('push: writing file=%s', _file)
      await fs.writeFile(_file, content)
    },
  })

  const user = await getUid()
  t.truthy(user)

  const {stdout: push, stderr: pushError} = await pushOci({
    image,
    targets: [file],
    user,
    annotations: {foo: 'bar'},
  })
  dbg('push: out=%o, err=%o', push, pushError)

  t.true(pushError.includes('Downloaded newer') || !pushError)

  dbg('push: clearing work dir=%s', work)
  await initHostWork()

  const {stdout: pull, stderr: pullError} = await pullOci({
    image,
    user,
  })
  dbg('pull: out=%o, err=%o', pull, pullError)
  t.true(pull[0].startsWith('Downloading'))
  t.is(await fs.readFile(`${work}/${file}`, 'utf8'), content)
})

test('push-oci: cwd', async (t) => {
  const file = 'package.json'
  const image = 'ttl.sh/oci-scratch:1.0.0'
  process.env.CONTAINR_WORK_IS_CWD = 'true'
  const work = getHostWork()
  t.is(work, process.cwd())

  const user = await getUid()
  t.truthy(user)

  const {stdout: push, stderr: pushError} = await pushOci({
    image,
    targets: [file],
    user,
    annotations: {foo: 'bar'},
  })
  dbg('push: out=%o, err=%o', push, pushError)

  t.true(pushError.includes('Downloaded newer') || !pushError)

  const stat = await fs.stat(file)
  dbg('push-oci-cwd: mtime=%s', stat.mtime)

  const {stdout: pull, stderr: pullError} = await pullOci({
    image,
    user,
  })
  dbg('pull: out=%o, err=%o', pull, pullError)
  t.true(pull[0].startsWith('Downloading'))
  const content = await fs.readFile(`${work}/${file}`, 'utf8')
  t.true(content.startsWith('{'))
  const _stat = await fs.stat(file)
  dbg('push-oci-cwd: mtime=%s', _stat.mtime)
  t.true(stat.mtime !== _stat.mtime)
  delete process.env.CONTAINR_WORK_IS_CWD
})
