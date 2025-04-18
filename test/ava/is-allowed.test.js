import test from 'ava'
import _ from 'lodash'
// import debug from '@watchmen/debug'
import {isAllowed} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('is-allowed: basic', (t) => {
  t.false(isAllowed({error: 'nope', allowedErrors: ['nah', 'nuh']}))
})

test('is-allowed: partial', (t) => {
  // beware: no allows nope
  t.true(isAllowed({error: 'nope', allowedErrors: ['nah', 'nuh', 'no']}))
})

test('is-allowed: null error', (t) => {
  t.true(isAllowed({allowedErrors: ['nah', 'nuh', 'no']}))
})

test('is-allowed: null allowed', (t) => {
  t.false(isAllowed({error: 'nope'}))
})

test('is-allowed: array', (t) => {
  t.true(isAllowed({error: ['nope', 'not'], allowedErrors: ['nope', 'not']}))
})

test('is-allowed: array-more', (t) => {
  t.true(
    isAllowed({error: ['nope', 'not'], allowedErrors: ['nope', 'not', 'nix']}),
  )
})

test('is-allowed: array-fail', (t) => {
  t.false(
    isAllowed({error: ['nope', 'not', 'nix'], allowedErrors: ['nope', 'not']}),
  )
})

test('is-allowed: empty', (t) => {
  t.true(
    isAllowed({
      error: ['nope', 'not', '', '  '],
      allowedErrors: ['nope', 'not'],
    }),
  )
})
