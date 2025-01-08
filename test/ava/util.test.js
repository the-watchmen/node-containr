import test from 'ava'
// import debug from '@watchmen/debug'
import {toParams} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('to-params: basic', (t) => {
  t.is(toParams({map: {a: 'b', c: 'd'}, param: '--foo'}), '--foo a=b --foo c=d')
})

test('to-params: sep', (t) => {
  t.is(
    toParams({map: {a: 'b', c: 'd'}, param: '--foo', separator: ':'}),
    '--foo a:b --foo c:d',
  )
})
