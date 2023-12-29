// azure-mock.ts

import sinon from 'sinon';
import { BlobServiceClient, ContainerClient, BlobClient, BlobItem } from "@azure/storage-blob";

export class AzureBlobError extends Error {
    public code: string;
    public statusCode?: number;
    public details?: any;
    
    constructor(message: string, code: string, statusCode?: number, details?: any) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

export const azureResolve = (res?: any): any => {
    return Promise.resolve(res);
};

export const azureReject = (err?: any): any => {
    return Promise.reject(err);
};

export const mockBlobServiceClient = (): sinon.SinonStubbedInstance<BlobServiceClient> => {
    const mock = sinon.createStubInstance(BlobServiceClient);
    mock.getContainerClient.returns(mockContainerClient());
    return mock;
};

export const mockContainerClient = (): sinon.SinonStubbedInstance<ContainerClient> => {
    const mock = sinon.createStubInstance(ContainerClient) as any;
    mock.getBlobClient.returns(mockBlobClient());
    mock.createIfNotExists.resolves(azureResolve({ succeeded: true }));

    // Create an async generator function that yields the blobs
    async function* listBlobsGenerator() {
        yield* [{ name: 'blob1' }, { name: 'blob2' }];
    }

    // Create a stub that returns the generator function
    mock.listBlobsFlat = sinon.stub().returns(listBlobsGenerator());

    return mock;
};

export const mockBlobClient = (): sinon.SinonStubbedInstance<BlobClient> => {
    const mock = sinon.createStubInstance(BlobClient) as any;
    mock.upload = sinon.stub().resolves(azureResolve({}));
    mock.downloadToBuffer.resolves(azureResolve(Buffer.from('mock-data')));
    mock.delete = sinon.stub().resolves(azureResolve({}));  // Mock for blob deletion
    return mock;
};
