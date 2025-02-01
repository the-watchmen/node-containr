module.exports = {
  containr: {
    images: {
      gcloud: 'google/cloud-sdk:503.0.0-alpine',
      _oras: {
        name: 'bitnami/oras:1.2.1',
        hasShell: false,
      },
      oras: {
        name: 'ghcr.io/oras-project/oras:v1.2.2',
        entrypoint: '/bin/sh',
      },
    },
  },
}
