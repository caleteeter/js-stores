// azure-mock.ts

import sinon from 'sinon';
import { BlobServiceClient, ContainerClient, BlockBlobClient } from "@azure/storage-blob";


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
    const mock = sinon.createStubInstance(ContainerClient);
    mock.getBlockBlobClient.returns(mockBlockBlobClient());
    mock.createIfNotExists.resolves(azureResolve({ succeeded: true }));

    return mock;
};

export const mockBlockBlobClient = (): sinon.SinonStubbedInstance<BlockBlobClient> => {
    const mock = sinon.createStubInstance(BlockBlobClient);

    mock.uploadData.callsFake((val, options) => {
        // Check for valid input data (e.g., buffer or string)
        if (!(val instanceof Buffer) && typeof val !== 'string') {
            return azureReject(new AzureBlobError('Invalid input data', 'ValidationError', 400));
        }

        // Check for expected options like metadata and abortSignal
        if (!(options && options.metadata && options.abortSignal)) {
            return azureReject(new AzureBlobError('Invalid options', 'ValidationError', 400));
        }

        // Simulate a successful upload
        return azureResolve({ success: true, message: 'Data uploaded successfully' });

        // Optionally, you can add more conditions to simulate different error scenarios
        // e.g., simulate network or server errors
    });

    // Mocking the download method
    mock.download.callsFake((offset, count, options) => {
        // Check if you want to simulate a not found error
        if (options?.abortSignal?.aborted) {
            const error = new AzureBlobError('Blob not found', 'NotFound', 404);
            return azureReject(error);
        }

        // Simulate a successful download
        // Create a mock readableStreamBody (This is just a placeholder, adapt as needed)
        const readableStreamBody = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("Mock blob content"));
                controller.close();
            }
        });

        return azureResolve({
            readableStreamBody: readableStreamBody
        });

        // Optionally, add more conditions to simulate other error scenarios
    });
    // Mocking the exists method
    mock.exists.callsFake((options) => {
        // Simulate blob existence based on some condition or test setup
        // if (/* condition to simulate blob existence */) {
        //     return azureResolve(true);
        // }
        // Default behavior (can be adjusted based on your test requirements)
        return azureResolve(false);

        // Optionally, add more conditions to simulate other scenarios
    });

    // Inside mockBlockBlobClient
    mock.delete.callsFake((options) => {
    // Simulate deletion based on conditions or test setup
    // if (/* condition to simulate successful deletion */) {
    //     return azureResolve();
    // }

    // // Simulate an error during deletion
    // if (options.simulateDeleteError) {
    //     return azureReject(new AzureBlobError('Delete failed', 'DeleteError', 500));
    // }

    return azureResolve();
    });

    // Inside mockContainerClient
    mock.getProperties.callsFake((options) => {
        // Simulate checking container properties
        // if (/* condition to simulate container exists */) {
        //     return azureResolve(/* container properties */);
        // }

        // Simulate container does not exist
        return azureReject(new AzureBlobError('Container not found', 'NotFound', 404));
    });

    return mock;
};
