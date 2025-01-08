/* eslint-disable no-undef */

import debug from '@watchmen/debug'
import {withImages, withContainer} from '../../src/index.js'

const dbg = debug(import.meta.url)

test('basic', async () => {
  const image = 'ubuntu'
  await withImages({
    images: {[image]: 'ubuntu:latest'},
    async closure(containers) {
      dbg('closure: containers=%o', containers)
      expect(containers[image]).toBeTruthy()
      const {stdout} = await withContainer({
        container: containers[image],
        input: 'ls',
        isLines: true,
      })
      dbg('out=%o', stdout)
      expect(stdout.includes('tmp')).toBe(true)
    },
  })
})

test(
  'gcp',
  async () => {
    const image = 'gcloud'
    const gcpConfig = '.config/gcloud'
    const _gcpConfig = `/root/${gcpConfig}`

    await withImages({
      images: {
        [image]: {
          name: 'google/cloud-sdk:503.0.0-alpine',
          volumes: {
            [_gcpConfig]: `${process.env.HOME}/${gcpConfig}`,
          },
        },
      },

      async closure(containers) {
        dbg('closure: containers=%o', containers)
        expect(containers[image]).toBeTruthy()
        const {stdout} = await withContainer({
          container: containers[image],
          // avoid command that requires auth here to facilitate running in ci
          //
          input: 'gcloud auth list',
          isLines: true,
        })
        dbg('out=%s', JSON.stringify(stdout, null, 2))
        expect(stdout).toBeTruthy()
      },
    })
  },
  30 * 1000,
)
