
# Block Store - Azure <!-- omit in toc -->

| Badge | Description |
| ----- | ----------- |
| ![Build Status](https://github.com/caleteeter/js-stores/workflows/Build/badge.svg) | Build Status |
| ![Issues](https://img.shields.io/github/issues/caleteeter/js-stores) | GitHub Issues |
| ![Pull Requests](https://img.shields.io/github/issues-pr/caleteeter/js-stores) | GitHub Pull Requests |
| ![Forks](https://img.shields.io/github/forks/caleteeter/js-stores) | Forks |
| ![Stars](https://img.shields.io/github/stars/caleteeter/js-stores) | Stars |
| ![License](https://img.shields.io/github/license/caleteeter/js-stores) | License |
| ![Last Commit](https://img.shields.io/github/last-commit/caleteeter/js-stores) | Last Commit |
| ![Codecov](https://codecov.io/gh/caleteeter/js-stores/branch/main/graph/badge.svg) | Code Coverage |
|![GitHub Contributors Image](https://contrib.rocks/image?repo=caleteeter/js-stores)| Contributions

## Table of Contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage for Block Store - Azure (```blockstore-azure```)](#usage-for-block-store---azure-blockstore-azure)
  - [Constructor Parameters](#constructor-parameters)
    - [Constructor Functionality](#constructor-functionality)
  - [Methods](#methods)
    - [`get` Method](#get-method)
    - [`put` Method](#put-method)
    - [`has` Method](#has-method)
    - [`getAll` Method](#getall-method)
    - [`delete` Method](#delete-method)
    - [`open` Method](#open-method)
- [Testing](#testing)
- [Contributing](#contributing)

## Introduction

blockstore-azure will be referred to as ```Block Store - Azure``` in this documentation.  ```Block Store - Azure``` is a comprehensive library for managing block storage in Azure Blob Storage and the IPFS Helina implementation. It provides an efficient and easy-to-use interface for storing, retrieving, and managing binary data in Azure in a decentralized manner.

## Installation

To install ```Block Store - Azure```, use npm:

```bash
npm install blockstore-azure
```

## Usage for Block Store - Azure (```blockstore-azure```)

Here's a simple example of how to use ```Block Store - Azure```

```typescript
const { AzureBlockstore } = require('blockstore-azure');
```

`constructor`: The constructor takes BlockServiceClient, a container name as a string, and an optional parameter of AzureBlockstoreInit.

```typescript
constructor(blobServiceClient: BlobServiceClient, container: string, init?: AzureBlockstoreInit)
```

### Constructor Parameters

1. **`blobServiceClient`** (`BlobServiceClient`):
   - An instance of Azure's `BlobServiceClient`.
   - Used for interacting with Azure Blob Storage services.
   - An error is thrown if this parameter is null.

2. **`container`** (`string`):
   - A string representing the Azure blob container name.
   - The container is used for storing blobs (blocks).
   - An error is thrown if this parameter is null.

3. **`init`** (`AzureBlockstoreInit`, optional):
   - Optional configuration settings for blockstore initialization.
   - Properties:
     - `createIfMissing` (`boolean`): Creates the container if it doesn't exist when `.open` is called.
     - `shardingStrategy` (`ShardingStrategy`): Determines how CIDs map to paths and back.

#### Constructor Functionality

- Initializes the `AzureBlockstore` instance with the provided Azure Blob Service client and container name.
- Sets the `blobServiceClient` to `this.azureClient` and the `container` string to `this.container`.
- The `createIfMissing` property is set based on the `init` object, defaulting to `false` if not specified.
- The `shardingStrategy` is set from the `init` object, defaulting to `NextToLast` if not provided.
- Initializes `this.containerClient` as a `ContainerClient` for the specified container and calls `createIfNotExists`.

### Methods

#### `get` Method

**Parameters**

- `key`: The key of the item to retrieve.

**Example**

```typescript
const item = await azureBlockstore.get(key);
```

#### `put` Method

**Parameters**

- `key`: The key under which to store the item.
- `value`: The item to store.

**Example**

```typescript
await azureBlockstore.put(key, value);
```

#### `has` Method

**Parameters**

- `key`: The key to check for existence.

**Example**

```typescript
const exists = await azureBlockstore.has(key);
```

#### `getAll` Method

**Parameters**

- None.

**Example**

```typescript
const items = await azureBlockstore.getAll();
```

#### `delete` Method

**Parameters**

- `key`: The key of the item to delete.

**Example**

```typescript
await azureBlockstore.delete(key);
```

#### `open` Method

**Parameters**

- None.

**Example**

```typescript
await azureBlockstore.open();
```

## Testing

## Contributing
