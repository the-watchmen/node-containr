/* eslint-disable no-undef */
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import debug from '@watchmen/debug'
import config from 'config'
import {withImage} from '../../src/index.js'

const dbg = debug(import.meta.url)

test('single line input', async () => {
  const {stdout} = await withImage({
    image: 'ubuntu',
    input: 'ls',
    isLines: true,
  })
  dbg('out=%o', stdout)
  expect(stdout.includes('tmp')).toBe(true)
})

test('multi line input', async () => {
  const {stdout} = await withImage({
    image: 'ubuntu',
    input: ['touch foo', 'ls foo'],
  })
  dbg('out=%o', stdout)
  expect(stdout).toBe('foo')
})

test('command', async () => {
  const result = await withImage({
    image: {name: 'bitnami/oras:1.2.1', hasShell: false},
    command: 'version',
    isLines: true,
  })
  dbg('result=%o', result)
  expect(result.stdout).toBeTruthy()
})

test('volume', async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const file = path.basename(import.meta.url)

  dbg('volume: dir=%o, file=%o', dir, file)

  const _file = `/${config.work.container}/${file}`
  const {stdout} = await withImage({
    image: 'ubuntu',
    input: `ls ${_file}`,
    volumes: {
      [`/${config.work.container}`]: dir,
    },
  })
  dbg('out=%o', stdout)
  expect(stdout).toBe(_file)
})

// permission issues creating files in github actions
//
// test('volume', async () => {
//   await fs.emptyDir(config.work.local)

//   const file = 'test.txt'
//   const content = 'stuff'
//   const _file = `${config.work.local}/${file}`
//   await fs.writeFile(_file, content)
//   dbg('volume: wrote file=%o', _file)

//   const {stdout} = await withImage({
//     image: 'ubuntu',
//     input: `cat /${config.work.container}/${file}`,
//   })
//   dbg('out=%o', stdout)
//   expect(stdout).toBe(content)
// })
