import test from 'ava'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import config from 'config'
import {toFlags, includes, getConfig, getHostWork} from '../../src/util.js'

const dbg = debug(import.meta.url)

test('to-flags: basic', (t) => {
  t.is(toFlags({map: {a: 'b', c: 'd'}, flag: 'foo'}), '--foo a=b --foo c=d')
})

test('to-flags: sep', (t) => {
  t.is(
    toFlags({map: {a: 'b', c: 'd'}, flag: 'foo', separator: ':'}),
    '--foo a:b --foo c:d',
  )
})

test('includes: array', (t) => {
  t.true(includes(['foo', 'bar', 'baz'], 'bar'))
  t.true(includes(['foo', 'foo bar baz', 'baz'], 'bar'))
  t.false(includes(['foo', 'bar', 'baz'], 'bip'))
})

test('includes: string', (t) => {
  t.true(includes('foo bar baz', 'bar'))
  t.false(includes('foo bar baz', 'bip'))
})

test('get-config: cfg', (t) => {
  dbg('config=%s', pretty(config))
  t.is(getConfig({path: 'a.b.c'}), config.containr.a.b.c)
})

test('get-config: cfg camel', (t) => {
  dbg('config=%s', pretty(config))
  t.is(getConfig({path: 'isTrue'}), config.containr.isTrue)
})

test('get-config: env', (t) => {
  const key = 'CONTAINR_A_B_D'
  process.env[key] = 'sumthin'
  t.is(getConfig({path: 'a.b.d'}), process.env[key])
  delete process.env[key]
})

test('get-config: dflt', (t) => {
  dbg('config=%s', pretty(config))
  const dflt = 'sumthin'
  t.is(getConfig({path: 'a.b.d', dflt}), dflt)
})

// test('get-host-root', (t) => {
//   t.is(getHostRoot(), '/tmp/containr/work')
// })

// test('get-host-root: env', (t) => {
//   const root = '/sumthin'
//   process.env.CONTAINR_HOST_ROOT = root
//   t.is(getHostRoot(), root)
//   delete process.env.CONTAINR_HOST_ROOT
// })

test('get-host-work', (t) => {
  const work = getHostWork()
  dbg('work=%s', work)
  t.true(work.startsWith('/tmp/containr/work'))
})

test('get-host-work: env', (t) => {
  const root = '/sumthin'
  const key = 'CONTAINR_WORK_HOST'
  process.env[key] = root
  const work = getHostWork()
  dbg('work=%s', work)
  t.true(work.startsWith(root))
  delete process.env[key]
})
