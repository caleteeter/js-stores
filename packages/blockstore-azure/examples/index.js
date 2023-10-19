/* eslint-disable linebreak-style */
/* eslint-disable no-console */
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { unixfs } from '@helia/unixfs'
import { createHelia } from 'helia'
import toBuffer from 'it-to-buffer'
import { AzureBlockstore } from '../dist/src/index.js'

const sharedKeyCredential = new StorageSharedKeyCredential('ctipfsstr', 'LT9qxiI0WXQOXjlyMPtgp1/vWkb/hE8GRQ8WEcOrONaSzRL4KaND9Ph3WX0WojAL27wakkKb/jpY+AStGk00cA==')
const azure = new BlobServiceClient('https://ctipfsstr.blob.core.windows.net', sharedKeyCredential)
const blobStore = new AzureBlockstore(azure, 'test');

const hNode = await createHelia({ blobStore });
const fs = unixfs(hNode)
const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3]))

console.log('\nAdded file:', cid)

const data = await toBuffer(fs.cat(cid))

console.log(`\nFetched file content containing ${data.byteLength} bytes`)

await hNode.stop()
