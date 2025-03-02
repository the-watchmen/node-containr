import test from 'ava'
import {execa} from 'execa'
import debug from '@watchmen/debug'

const dbg = debug(import.meta.url)

const run = 'docker run --rm -dit -v /var/run/docker.sock:/var/run/docker.sock'

test('run', async (t) => {
  const {stdout} = await execa(
    {},
  )`docker run --rm -dit -v /var/run/docker.sock:/var/run/docker.sock ubuntu /bin/sh`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})

test('var', async (t) => {
  const {stdout} = await execa({shell: true})`${run} ubuntu /bin/sh`
  dbg('stdout=%o', stdout)
  t.truthy(stdout)
})
