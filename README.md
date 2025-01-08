# node-containr

this library aims to provide a framework inspired by [the kubernetes plugin for jenkins](https://plugins.jenkins.io/kubernetes/) which allows for container based workloads to execute a series of command line directives across multiple container images.

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![build status](https://github.com/the-watchmen/node-containr/actions/workflows/release.yaml/badge.svg)](https://github.com/the-watchmen/node-containr/actions)
[![npm (scoped)](https://img.shields.io/npm/v/@watchmen/containr.svg)](https://www.npmjs.com/package/@watchmen/containr)

in pseudo-code, this might manifest as something like:

```
with-containers(
    maven: 'maven:3.9.9-eclipse-temurin-23-alpine',
    docker: 'docker:27.4.1-cli',
    kubectl: 'bitnami/kubectl:1.32.0'
) {
    with-container('maven') {
        'mvn package'
    }
    with-container('docker') {
        'docker build .'
    }
    with-container('kubectl') {
        'kubectl apply manifest.yaml'
    }
}
```

the implementation uses [the solid execa package](https://github.com/sindresorhus/execa/blob/main/readme.md) to exeecute command line directives against a docker container runtime which must be running on the host.

if this library is used in a container, communication between the docker client and the docker server running on the host must be supported by [mounting the docker socket](https://stackoverflow.com/questions/63201603/what-is-the-result-of-mounting-var-run-docker-sock-in-a-docker-in-docker-scen).

## installation

```
npm i @watchmen/containr
```

## usage

see [tests](./test)
