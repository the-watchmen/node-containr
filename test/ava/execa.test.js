import test from 'ava'
import {execa} from 'execa'
import debug from '@watchmen/debug'

const dbg = debug(import.meta.url)

test('run', async (t) => {
  const {stdout} = await execa({})`docker run --rm -dit ubuntu /bin/sh`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})

test('var', async (t) => {
  const cmd = 'docker run --rm -dit ubuntu /bin/sh'
  const {stdout} = await execa({shell: true})`${cmd}`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})
