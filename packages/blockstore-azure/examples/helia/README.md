
# Use with Helia
======

This example uses an `AzureBlockstore` instance to serve as the entire backend for Helia.

## Running

The Azure Blob Storage parameters must be updated with an existing Container and credentials with access to it:

```js
const { BlobServiceClient } = require('@azure/storage-blob');
const { AzureBlockstore } = require('path-to-azure-blockstore');

// Configure Azure Blob Service Client as normal
const blobServiceClient = BlobServiceClient.fromConnectionString(
  'DefaultEndpointsProtocol=https;AccountName=myaccountname;AccountKey=myaccountkey;EndpointSuffix=core.windows.net'
);

const containerName = 'my-container';

const datastore = new AzureBlockstore(blobServiceClient, containerName);
```

Once the Azure instance has its needed data, you can run the example:

```
npm install
node index.js
```

**Notes:**

- Replace `'path-to-azure-blockstore'` with the actual path where your `AzureBlockstore` class is defined.
- The connection string in `BlobServiceClient.fromConnectionString` should be replaced with your actual Azure Storage account's connection string.
- Replace `'my-container'` with the name of your existing Azure Blob Storage container.
