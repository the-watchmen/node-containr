import test from 'ava'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import {getConfig} from '@watchmen/configr'
import {toFlags, includes, getHostWork} from '../../src/util.js'

const dbg = debug(import.meta.url)
const caller = import.meta.url
const config = await getConfig({caller})

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

test('cfg', (t) => {
  dbg('config=%s', pretty(config))
  t.is(config.containr.a.b.c, 'abc')
})

test('cfg-bool', (t) => {
  dbg('config=%s', pretty(config))
  t.is(config.containr.isTrue, true)
})

test('cfg-env', async (t) => {
  const key = 'configr_a_b_d'
  const val = 'sumthin'
  process.env[key] = val
  const config = await getConfig({caller, bustCache: true})
  dbg('config=%s', pretty(config))
  t.is(config.a.b.d, val)
  delete process.env[key]
})

test('cfg-dflt', (t) => {
  dbg('config=%s', pretty(config))
  const dflt = 'sumthin'
  t.is(config?.nope ?? dflt, dflt)
})

test('get-host-work', (t) => {
  const work = getHostWork()
  dbg('work=%s', work)
  t.true(work.startsWith('/tmp/containr/work'))
})

// would not work unless config is dynamically
// reevaluated within util module, but not sure
// this is required behavior currently
//
// test('ghw-env', (t) => {
//   const root = '/sumthin'
//   const key = 'configr_work_host'
//   process.env[key] = root
//   const work = getHostWork()
//   dbg('work=%s', work)
//   t.true(work.startsWith(root))
//   delete process.env[key]
// })
