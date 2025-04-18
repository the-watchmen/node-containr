import test from 'ava'
import _ from 'lodash'
// import debug from '@watchmen/debug'
import {_dbg} from '../../src/util.js'

// const dbg = debug(import.meta.url)
const key = 'key-1'

test('null', (t) => {
  _dbg({key, value: null})
  t.pass()
})

test('undefined', (t) => {
  _dbg({key, value: undefined})
  t.pass()
})

test('none', (t) => {
  _dbg({key, value: ''})
  t.pass()
})

test('blank', (t) => {
  _dbg({key, value: ' '})
  t.pass()
})

test('some', (t) => {
  _dbg({key, value: ' foo '})
  t.pass()
})

test('array-null', (t) => {
  _dbg({key, value: [' ', '', null, undefined]})
  t.pass()
})

test('array-one', (t) => {
  _dbg({key, value: [' ', '', null, undefined, ' foo ']})
  t.pass()
})

test('array-multi', (t) => {
  _dbg({key, value: [' foo', ' ', '', null, undefined, 'bar ']})
  t.pass()
})
