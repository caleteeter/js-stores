// index.spec.ts

import { expect } from 'aegir/chai'
import sinon from 'sinon';
import { AzureBlockstore } from '../src/index';
import { mockBlobServiceClient, mockContainerClient, AzureBlobError } from './utils/azure-mock';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2';

const mockCID = await generateTestCID();

describe('AzureBlockstore', () => {
    let blockstore: AzureBlockstore;
    let blobServiceClientMock: BlobServiceClient;
    let containerClientMock: sinon.SinonStubbedInstance<ContainerClient>;

    beforeEach(() => {
        blobServiceClientMock = mockBlobServiceClient();
        containerClientMock = mockContainerClient();
        blockstore = new AzureBlockstore( blobServiceClientMock, 'containerName' );
    });

    afterEach(() => {
        sinon.restore();
    });

    // Test: Successful blob upload
    it('should upload a blob successfully', async () => {
        const data = Buffer.from('test data');
        await blockstore.put(mockCID, data);  // Assuming this method exists
        sinon.assert.calledWith(containerClientMock.getBlobClient, mockCID);
        sinon.assert.calledWith(blobServiceClientMock.upload, data);
    });

    // Test: Handle errors in blob upload
    it('should handle errors in blob upload', async () => {
        const data = Buffer.from('test data');
        const uploadStub = sinon.stub().rejects(new AzureBlobError('Error uploading', 'UploadError', 500));
        containerClientMock.getBlobClient.returns({ upload: uploadStub });

        try {
            await blockstore.put(mockCID, data);
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error).to.be.instanceOf(AzureBlobError);
            expect(error.code).to.equal('UploadError');
        }
    });

    // Test: Successful blob download
    it('should download a blob successfully', async () => {
        const expectedData = Buffer.from('test data');
        const data = await blockstore.get(mockCID);  // Assuming this method exists
        sinon.assert.calledWith(containerClientMock.getBlobClient, mockCID);
        sinon.assert.calledOnce(blobServiceClientMock.downloadToBuffer);
        expect(data).to.deep.equal(expectedData);
    });

    // Test: Handle errors in blob download
    it('should handle errors in blob download', async () => {
        containerClientMock.getBlobClient.returns({ downloadToBuffer: sinon.stub().rejects(new AzureBlobError('Error downloading', 'DownloadError', 500)) });

        try {
            await blockstore.get(mockCID);
            expect.fail('Expected error was not thrown');
        } catch (error) {
            expect(error).to.be.instanceOf(AzureBlobError);
            expect(error.code).to.equal('DownloadError');
        }
    });

    // Test: Successful blob deletion
    it('should delete a blob successfully', async () => {
        await blockstore.delete(mockCID);  // Assuming this method exists
        sinon.assert.calledWith(containerClientMock.getBlobClient, mockCID);
        sinon.assert.calledOnce(blobServiceClientMock.delete);
    });

    // Test: Handle errors in blob deletion
    it('should handle errors in blob deletion', async () => {
        const deleteStub = sinon.stub().rejects(new AzureBlobError('Error deleting', 'DeleteError', 500));
        containerClientMock.getBlobClient.returns({ delete: deleteStub });

        try {
            await blockstore.delete(mockCID);
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