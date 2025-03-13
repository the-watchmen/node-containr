import test from 'ava'
import debug from '@watchmen/debug'
import _ from 'lodash'
import {stringify} from '@watchmen/helpr'
import {withImages} from '../../src/index.js'
import {initWork} from '../../src/util.js'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await initWork()
})

test('basic', async (t) => {
  const image = 'ubuntu'
  await withImages({
    images: {[image]: 'ubuntu:latest'},
    async closure(withContainer) {
      t.truthy(withContainer)
      const out = await withContainer({
        image,
        input: 'ls /',
      })
      dbg('out=%o', out)
      t.true(out.includes('tmp'))
    },
  })
})

test('allowed', async (t) => {
  const image = 'ubuntu'
  await withImages({
    images: {[image]: 'ubuntu:latest'},
    async closure(withContainer) {
      t.truthy(withContainer)
      const out = await withContainer({
        image,
        input: 'ls nope',
        allowedErrors: ['No such'],
      })
      dbg('out=%o', out)
      t.true(_.isEmpty(out))
    },
  })
})

test('throws', async (t) => {
  await t.throwsAsync(_withImages({t}), {instanceOf: Error})
})

test(
  'does not throw',
  async (t) => {
    await t.notThrowsAsync(async () => {
      const {stdout, stderr} = await _withImages({t, throwOnError: false})
      dbg('out=%o, err=%o', stdout, stderr)
      t.truthy(stderr)
    })
  },
  30 * 1000,
)

async function _withImages({t, throwOnError = true}) {
  const image = 'gcloud'
  const gcpConfig = '.config/gcloud'
  const _gcpConfig = `/root/${gcpConfig}`

  return withImages({
    images: {
      [image]: {
        name: 'google/cloud-sdk:503.0.0-alpine',
        volumes: {
          [_gcpConfig]: `${process.env.HOME}/${gcpConfig}`,
        },
      },
    },

    async closure(withContainer) {
      const withGcloud = (args) => withContainer({...args, image})

      const out = await withGcloud({
        input: 'gcloud auth list',
        throwOnError,
      })

      dbg('out=%s', stringify(out))
      t.truthy(out)
      return out
    },
  })
}

test('entry', async (t) => {
  const image = 'oras'
  await withImages({
    images: {
      [image]: {
        name: 'ghcr.io/oras-project/oras:v1.2.2',
        entrypoint: '/bin/sh',
      },
    },
    async closure(withContainer) {
      t.truthy(withContainer)
      const out = await withContainer({
        image,
        input: 'which oras',
      })
      dbg('out=%o', out)
      t.is(out, '/bin/oras')
    },
  })
})
