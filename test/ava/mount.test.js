import test from 'ava'
import debug from '@watchmen/debug'
import fs from 'fs-extra'
import _ from 'lodash'
import {withImage} from '../../src/index.js'
import {getHostWork, getContainerWork, initWork} from '../../src/util.js'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await initWork()
})

test('mount', async (t) => {
  const file = 'scratch.txt'
  const image = 'debian:bookworm-slim'
  const content = 'foo\n'
  const hostFile = `${getHostWork()}/${file}`
  const containerFile = `${getContainerWork()}/${file}`

  await fs.emptyDir(getHostWork())

  dbg('mount: initializing host file=%s', hostFile)
  await fs.writeFile(hostFile, content)

  // const user = await getUid()

  const {stdout, stderr} = await withImage({
    image,
    input: [
      `ls -la ${containerFile}`,
      `cat ${containerFile}`,
      `echo 'bar' >> ${containerFile}`,
      `cat ${containerFile}`,
    ],
    // user,
    isLines: true,
    throwOnError: false,
  })
  dbg('mount: out=%s, err=%s', stdout, stderr)
  t.pass()
})
