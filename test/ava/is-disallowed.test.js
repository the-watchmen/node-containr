import test from 'ava'
import _ from 'lodash'
// import debug from '@watchmen/debug'
import {isDisallowed} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('is-disallowed: basic', (t) => {
  t.false(isDisallowed({out: 'nope', disallowedOut: ['nah', 'nuh']}))
})

test('is-disallowed: partial', (t) => {
  // beware: no allows nope
  t.true(isDisallowed({out: 'nope', disallowedOut: ['nah', 'nuh', 'no']}))
})

test('is-disallowed: null out', (t) => {
  t.false(isDisallowed({disallowedOut: ['nah', 'nuh', 'no']}))
})

test('is-disallowed: null allowed', (t) => {
  t.false(isDisallowed({out: 'nope'}))
})

test('is-disallowed: array', (t) => {
  t.true(isDisallowed({out: ['nope', 'not'], disallowedOut: ['nope', 'not']}))
})

test('is-disallowed: allowed', (t) => {
  t.false(isDisallowed({out: ['yep', 'yup'], disallowedOut: ['nope', 'not']}))
})

test('is-disallowed: array-more', (t) => {
  t.true(
    isDisallowed({out: ['nope', 'not'], disallowedOut: ['nope', 'not', 'nix']}),
  )
})

test('is-disallowed: array-fail', (t) => {
  t.true(
    isDisallowed({out: ['nope', 'not', 'nix'], disallowedOut: ['nope', 'not']}),
  )
})

test('is-disallowed: empty', (t) => {
  t.true(
    isDisallowed({
      out: ['nope', 'not', '', '  '],
      disallowedOut: ['nope', 'not'],
    }),
  )
})
