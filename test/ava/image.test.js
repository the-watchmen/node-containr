import {fileURLToPath} from 'node:url'
import path from 'node:path'
import test from 'ava'
import debug from '@watchmen/debug'
import {withImage} from '../../src/index.js'
import {getContainerWork, getUid, initWork} from '../../src/util.js'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await initWork()
})

test('single line input', async (t) => {
  const {stdout} = await withImage({
    image: 'ubuntu',
    input: 'ls /',
    isLines: true,
  })
  dbg('out=%o', stdout)
  t.true(stdout.includes('tmp'))
})

test('multi line input', async (t) => {
  const {stdout} = await withImage({
    image: 'ubuntu',
    input: ['touch foo', 'ls foo'],
    user: await getUid(),
  })
  dbg('out=%o', stdout)
  t.deepEqual(stdout, ['foo'])
})

test('command', async (t) => {
  const result = await withImage({
    image: {name: 'bitnami/oras:1.2.1', hasShell: false},
    command: 'version',
    isLines: true,
  })
  dbg('result=%o', result)
  t.truthy(result.stdout)
})

test('volume', async (t) => {
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const file = path.basename(import.meta.url)

  dbg('volume: dir=%o, file=%o', dir, file)

  const {stdout} = await withImage({
    image: 'ubuntu',
    input: `ls ${file}`,
    volumes: {
      [getContainerWork()]: dir,
    },
  })
  dbg('out=%o', stdout)
  t.deepEqual(stdout, [file])
})

test('entry', async (t) => {
  const {stdout} = await withImage({
    image: {
      name: 'ghcr.io/oras-project/oras:v1.2.2',
      entrypoint: 'sh',
    },
    input: 'which oras',
  })
  dbg('out=%o', stdout)
  t.truthy(stdout)
})
