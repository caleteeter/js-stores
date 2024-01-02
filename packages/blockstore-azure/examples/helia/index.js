import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import toBuffer from 'it-to-buffer';
import { BlobServiceClient } from '@azure/storage-blob';
import { AzureBlockstore } from '../../src/index';

async function main() {
  // Configure Azure Blob Service Client
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    'DefaultEndpointsProtocol=https;AccountName=myaccountname;AccountKey=myaccountkey;EndpointSuffix=core.windows.net'
  );

  // Initialize AzureBlockstore with Azure Blob Service Client and container name
  const containerName = 'my-container';
  const datastore = new AzureBlockstore(blobServiceClient, containerName);

  // Create a new Helia node with our AzureBlockstore backed Repo
  console.log('Start Helia');
  const node = await createHelia({
    datastore
  });

  // Test out the repo by sending and fetching some data
  console.log('Helia is ready');

  try {
    const fs = unixfs(node);

    // Let's add a file to Helia
    const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3]));

    console.log('\nAdded file:', cid.toString());

    // Log out the added file's metadata and cat the file
    const data = await toBuffer(fs.cat(cid));

    // Print out the file's contents to console
    console.log(`\nFetched file content containing ${data.byteLength} bytes`);
  } catch (err) {
    // Log out the error
    console.log('File Processing Error:', err);
  }

  // After everything is done, shut the node down
  console.log('\n\nStopping the node');
  await node.stop();
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
