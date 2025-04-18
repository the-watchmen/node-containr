import test from 'ava'
import _ from 'lodash'
// import debug from '@watchmen/debug'
import {strip} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('empty', (t) => {
  t.is(strip([]), null)
})

test('strip-single', (t) => {
  t.is(strip(['']), null)
})

test('strip-multi', (t) => {
  t.true(_.isEmpty(strip(['', ' ', null, undefined])))
})

test('strip-some', (t) => {
  t.deepEqual(strip([' foo', '', ' ', 'bar ']), ['foo', 'bar'])
})

test('null', (t) => {
  t.true(_.isEmpty(strip(null)))
})

test('undefined', (t) => {
  t.true(_.isEmpty(strip(undefined)))
})

test('none', (t) => {
  t.is(strip(''), null)
})

test('blank', (t) => {
  t.is(strip(' '), null)
})

test('some', (t) => {
  t.is(strip('foo'), 'foo')
})

test('some-trim', (t) => {
  t.is(strip(' foo '), 'foo')
})
