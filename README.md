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

> one important aspect of this package is to mount a consistent working directory across all the
> containers so that it simulates calling a series of command line actions from a single working directory

the implementation uses [the quality execa package](https://github.com/sindresorhus/execa/blob/main/readme.md) to execute command line directives against a docker container runtime which must be running on the host.

if this library is used in a container, communication between the docker client and the docker server running on the host must be supported by [mounting the docker socket](https://stackoverflow.com/questions/63201603/what-is-the-result-of-mounting-var-run-docker-sock-in-a-docker-in-docker-scen).

## installation

```
npm i @watchmen/containr
```

## usage

see [tests](./test)

## scenarios

there are a few scenarios in which this package can operate

### work directory is the current working directory

this scenario would b similar to a ci environment like jenkins or github-actions
in which all the files of a github repo are checked out in the current working directory
and the intention is to operate on those files as a ci flow might for linting and testing purposes

for this scenario, the following environment variable should be set to `true`

- `CONTAINR_WORK_IS_INIT`

### work directory is a new empty directory

this scenario would be similar to a cd environment before a set of artifacts to deploy have been
placed in the working directory.

this is the default scenario and there are helper functions within the package to generate new
work folders from a provided parent folder.

this parent folder will default to `/tmp/containr/work` but can be overridden with the following environment variable which should b set to an absolute folder path

- `CONTAINR_WORK_HOST`

when mounting this to orchestrated docker containers it will always be mounted to the container folder returned by the helper function `getContainerWork()`, but this folder should be set as the docker working directory and the client should not have to reference this path directly, but rather just operate in the current working directory.
