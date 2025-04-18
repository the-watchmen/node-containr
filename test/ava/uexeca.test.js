import test from 'ava'
// import debug from '@watchmen/debug'
import {_execa} from '../../src/util.js'

// const dbg = debug(import.meta.url)

test('basic', async (t) => {
  const ls = await _execa({cmd: 'ls -la'})
  t.true(Array.isArray(ls))
})
