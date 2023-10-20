/* eslint-disable linebreak-style */
/* eslint-disable no-console */
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { unixfs } from '@helia/unixfs'
import { createHelia } from 'helia'
import toBuffer from 'it-to-buffer'
import { AzureBlockstore } from '../dist/src/index.js'
import * as dotenv from 'dotenv'
import { ServiceClient } from '@azure/core-http'

dotenv.config()

const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;
const blobBaseUrl = process.env.BLOB_BASE_URL;

if (!storageAccountName) {
    throw new Error('STORAGE_ACCOUNT_NAME is missing in the .env file');
}
if (!storageAccountKey) {
    throw new Error('STORAGE_ACCOUNT_KEY is missing in the .env file');
}
if (!blobBaseUrl) {
    throw new Error('BLOB_BASE_URL is missing in the .env file');
}

const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey)

const blobEndPoint = `${storageAccountName}${blobBaseUrl}`;

const azure = new BlobServiceClient(blobEndPoint, sharedKeyCredential);

const blobStore = new AzureBlockstore(azure, 'test');

const hNode = await createHelia({ blobStore });
const fs = unixfs(hNode)
const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3]))

console.log('\nAdded file:', cid)

const data = await toBuffer(fs.cat(cid))

console.log(`\nFetched file content containing ${data.byteLength} bytes`)

await hNode.stop()
