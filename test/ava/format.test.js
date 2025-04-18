import test from 'ava'
import _ from 'lodash'
// import debug from '@watchmen/debug'
import {format} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('null', (t) => {
  t.is(format(null), null)
})

test('undefined', (t) => {
  t.is(format(undefined), null)
})

test('none', (t) => {
  t.is(format(''), null)
})

test('blank', (t) => {
  t.is(format(' '), null)
})

test('some', (t) => {
  t.is(format('foo'), '[foo]')
})

test('array-null', (t) => {
  t.is(format(['', ' ']), null)
})

test('array-one', (t) => {
  t.is(format([' foo ', ' ', null]), '[foo]')
})

test('array-multi', (t) => {
  t.is(format([' foo', ' ', null, 'bar ']), '[\n  "foo",\n  "bar"\n]')
})
