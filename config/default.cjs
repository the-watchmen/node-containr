module.exports = {
  containr: {
    images: {
      gcloud: 'google/cloud-sdk:503.0.0-alpine',
      oras: {
        name: 'bitnami/oras:1.2.1',
        hasShell: false,
      },
    },
  },
}
