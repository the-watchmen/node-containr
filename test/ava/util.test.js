import test from 'ava'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {pretty} from '@watchmen/helpr'
import config from 'config'
import {toFlags, includes, filterError, getConfig} from '../../src/util.js'

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

test('filter-error', (t) => {
  const result = filterError({
    result: {stderr: ['foo', 'blah downloaded blah']},
    whitelist: ['downloaded'],
  })
  dbg('filter-error: result=%o', result)
  t.true(_.isEmpty(result.stderr))
})

test('filter-error: dont', (t) => {
  const result = filterError({
    result: {stderr: ['foo', 'blah blah']},
    whitelist: ['downloaded'],
  })
  dbg('filter-error-dont: result=%o', result)
  t.false(_.isEmpty(result.stderr))
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
  process.env.CONTAINR_A_B_D = 'sumthin'
  t.is(getConfig({path: 'a.b.d'}), process.env.CONTAINR_A_B_D)
  delete process.env.CONTAINR_A_B_D
})

test('get-config: dflt', (t) => {
  dbg('config=%s', pretty(config))
  const dflt = 'sumthin'
  t.is(getConfig({path: 'a.b.d', dflt}), dflt)
})
