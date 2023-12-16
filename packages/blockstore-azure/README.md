# blockstore-s3 <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-stores.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-stores)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-stores/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/js-stores/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> IPFS blockstore implementation backed by s3

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Usage](#usage)
  - [Create a Repo](#create-a-repo)
  - [Examples](#examples)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i blockstore-azure
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `BlockstoreAzure` in the global namespace.

```html
<script src="https://unpkg.com/blockstore-azure/dist/index.min.js"></script>
```

## Usage

If the flag `createIfMissing` is not set or is false, then the container must be created prior to using datastore-azure. Please see the Azure docs for information on how to configure the blob storage account. A container name is required to be set at the blob account level, see the below example.

```js
import S3 from 'aws-sdk/clients/s3.js'
import { S3Datastore } from 'datastore-s3'

const s3Instance = new S3({ params: { Bucket: 'my-ipfs-bucket' } })
const store = new S3Datastore('.ipfs/datastore', {
  s3: s3Instance
  createIfMissing: false
})
```

### Create a Repo

See [examples/full-azure-repo](./examples/full-azure-repo) for how to quickly create an Azure backed repo using the `createRepo` convenience function.

### Examples

You can see examples of Azure backed ipfs in the [examples folder](examples/)

## API Docs

- <https://ipfs.github.io/js-stores/modules/blockstore_azure.html>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-stores/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)