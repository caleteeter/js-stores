/* eslint-disable linebreak-style */
/* eslint-disable no-console */
import { env } from 'node:process'
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { unixfs } from '@helia/unixfs'
import { createHelia } from 'helia'
import toBuffer from 'it-to-buffer'
import { AzureBlockstore } from '../../blockstore-azure/dist/src/index.js'
import { AzureDatastore } from '../dist/src/index.js'

async function main() {
  const storageAccountName = env.AZURE_STORAGE_NAME ?? '<add storage account name>'
  const storageAccountKey = env.AZURE_STORAGE_KEY ?? '<add storage account key>'
  const storageContainerName = env.AZURE_IPFS_CONTAINER_NAME ?? '<add storage container name>'

  const sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey)
  const azure = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, sharedKeyCredential)
  const dataStore = new AzureDatastore(azure, storageContainerName, { createIfMissing: true });
  const blockStore = new AzureBlockstore(azure, storageContainerName, { createIfMissing: true });

  const hNode = await createHelia({ datastore: dataStore, blockstore: blockStore });
  try {
    const fs = unixfs(hNode)
    const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4, 5, 6]))

    console.log('\nAdded file:', cid)

    const data = await toBuffer(fs.cat(cid))

    console.log(`\nFetched file content containing ${data.byteLength} bytes`)
  } catch (err) {
    console.log('File processing error', err);
  }
  await hNode.stop()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
});