import test from 'ava'
import {$} from 'execa'
import debug from '@watchmen/debug'
import {_execa} from '../../src/util.js'

const dbg = debug(import.meta.url)

test('run', async (t) => {
  const {stdout} = await $({
    lines: true,
  })`docker run --rm ubuntu ls`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})

test('ls', async (t) => {
  const {stdout} = await $({lines: true})`ls -la ${process.env.HOME}/.config`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})

test('stdout', async (t) => {
  const {stdout} = await $`pwd`
  dbg('out=%s', stdout)
  t.truthy(stdout)
})

test('basic', async (t) => {
  const out = await _execa({cmd: 'ls -la'})
  dbg('out=%s', out)
  t.truthy(out)
})

test('silent-err', async (t) => {
  await t.throwsAsync(() => {
    return _execa({cmd: 'ls -la nope', isSilentErr: true})
  })
})

test('silent-out', async (t) => {
  const out = await _execa({cmd: 'ls -la', isSilentOut: true})
  dbg('out=%s', out)
  t.truthy(out)
})
