// index.spec.ts

import { expect } from 'aegir/chai'
import sinon from 'sinon';
import { AzureBlockstore } from '../src/index';
import { mockBlobServiceClient, mockContainerClient, AzureBlobError, mockBlockBlobClient } from './utils/azure-mock';
import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2';

const mockCID = await generateTestCID();

describe('AzureBlockstore', () => {
    let blockStore: AzureBlockstore;
    let blobServiceClientMock: sinon.SinonStubbedInstance<BlobServiceClient>;
    let containerClientMock: sinon.SinonStubbedInstance<ContainerClient>;
    let blobClientMock: sinon.SinonStubbedInstance<BlockBlobClient>;   

    beforeEach(() => {
        blobServiceClientMock = mockBlobServiceClient();
        containerClientMock = mockContainerClient();
        blobClientMock = mockBlockBlobClient();
        blockStore = new AzureBlockstore( blobServiceClientMock, 'containerName' );
    });

    afterEach(() => {
        sinon.restore();
    });

    // Test: Successful blob upload
    it('should upload a blob successfully', async () => {
        const data = Buffer.from('test data');
        await blockStore.put(mockCID, data);  // Assuming this method exists
        sinon.assert.calledWith(containerClientMock.getBlockBlobClient, mockCID.toString());
        sinon.assert.calledWith(blobClientMock.uploadData, data);
        
    });

    // Test: Handle errors in blob upload
    // Test: Handle errors in blob upload
it('should handle errors in blob upload', async () => {
    const data = Buffer.from('test data');
    const blobClientStub = sinon.createStubInstance(BlockBlobClient);
    blobClientStub.uploadData.rejects(new AzureBlobError('Error uploading', 'UploadError', 500));
    containerClientMock.getBlockBlobClient.returns(blobClientStub);

    try {
        await blockStore.put(mockCID, data);
        expect.fail('Expected error was not thrown');
    } catch (error) {
        expect(error).to.be.instanceOf(AzureBlobError);
        expect(error.code).to.equal('UploadError');
    }
});


    // Test: Successful blob download
    it('should download a blob successfully', async () => {
        const expectedData = Buffer.from('test data');
    
        // Stub for getBlobClient
        const blobClientStub = sinon.createStubInstance(BlockBlobClient);
        containerClientMock.getBlobClient.returns(blobClientStub);
    
        // Spy for the download method
        const downloadSpy = sinon.spy(blobClientStub, 'download');
    
        // Perform the action
        const data = await blockStore.get(mockCID);  // Assuming this method exists
    
        // Assertions
        sinon.assert.calledWith(containerClientMock.getBlobClient, mockCID.toString());
        sinon.assert.calledOnce(downloadSpy);
        expect(data).to.deep.equal(expectedData);
    });
    

    // Test: Handle errors in blob download
    it('should handle errors in blob download', async () => {
        const blobClientStub = sinon.createStubInstance(BlockBlobClient);
        blobClientStub.downloadToBuffer.rejects(new AzureBlobError('Error downloading', 'DownloadError', 500));
        containerClientMock.getBlobClient.returns(blobClientStub);
    
        try {
            await blockStore.get(mockCID);
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error).to.be.instanceOf(AzureBlobError);
            expect(error.code).to.equal('DownloadError');
        }
    });

    // Test: Successful blob deletion
    it('should delete a blob successfully', async () => {
        // Assuming mockCID.toString() returns the appropriate string identifier for the blob
        const blobIdentifier = mockCID.toString();
    
        // Stub for getBlobClient
        const blobClientStub = sinon.createStubInstance(BlockBlobClient);
        containerClientMock.getBlobClient.returns(blobClientStub);
    
        // Spy for the delete method
        const deleteSpy = sinon.spy(blobClientStub, 'delete');
    
        // Perform the delete action
        await blockStore.delete(mockCID);
    
        // Assertions
        sinon.assert.calledWith(containerClientMock.getBlobClient, blobIdentifier);
        sinon.assert.calledOnce(deleteSpy);
    });
    

    // Test: Handle errors in blob deletion
    it('should handle errors in blob deletion', async () => {
        // Create a stubbed instance of BlobClient
        const blobClientStub = sinon.createStubInstance(BlockBlobClient);
    
        // Stub the delete method to reject with an error
        blobClientStub.delete.rejects(new AzureBlobError('Error deleting', 'DeleteError', 500));
    
        // Return the stubbed instance when getBlobClient is called
        containerClientMock.getBlobClient.returns(blobClientStub);
    
        try {
            await blockStore.delete(mockCID);
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error).to.be.instanceOf(AzureBlobError);
            expect(error.code).to.equal('DeleteError');
        }
    });
});

async function generateTestCID(): Promise<CID> {
    // Create a random buffer or use deterministic content for reproducibility
    const content = Buffer.from('Hello, world! ' + new Date().toISOString());
    // Create a hash of the content
    const hash = await sha256.digest(content);
    // Generate a CID from the hash
    return CID.create(1, sha256.code, hash);
}