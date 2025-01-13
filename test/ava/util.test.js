import test from 'ava'
import _ from 'lodash'
import debug from '@watchmen/debug'
import {toParams, includes, filterError} from '../../src/util.js'

const dbg = debug(import.meta.url)

test('to-params: basic', (t) => {
  t.is(toParams({map: {a: 'b', c: 'd'}, param: '--foo'}), '--foo a=b --foo c=d')
})

test('to-params: sep', (t) => {
  t.is(
    toParams({map: {a: 'b', c: 'd'}, param: '--foo', separator: ':'}),
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
