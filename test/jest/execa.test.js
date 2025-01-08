/* eslint-disable no-undef */

import {execa} from 'execa'
import debug from '@watchmen/debug'

const dbg = debug(import.meta.url)

test('run', async () => {
  const {stdout} = await execa({})`docker run --rm -dit ubuntu /bin/sh`
  dbg('stdout=%o', stdout)
  expect(stdout).toBeTruthy()
})

test('var', async () => {
  const cmd = 'docker run --rm -dit ubuntu /bin/sh'
  const {stdout} = await execa({shell: true})`${cmd}`
  dbg('stdout=%o', stdout)
  expect(stdout).toBeTruthy()
})
