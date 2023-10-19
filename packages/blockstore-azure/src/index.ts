import { BaseBlockstore } from "blockstore-core/base"
import * as Errors from 'blockstore-core/errors'
import { NextToLast, type ShardingStrategy } from "./sharding.js"
import type { AbortOptions } from "interface-store"
import { ContainerClient } from "@azure/storage-blob"
import type { Pair } from "interface-blockstore"
import type { CID } from 'multiformats/cid'

export interface AzureBlockstoreInit {
    /**
     * Whether to try to create the container if it is missing when '.open' is called
     */
    createIfMissing?: boolean

    /**
     * Control how CIDs map to paths and back
     */
    shardingStrategy?: ShardingStrategy
}

/**
 * A blockstore backed by Azure Blob Storage
 */
export class AzureBlockstore extends BaseBlockstore {
    public createIfMissing: boolean
    private readonly azureClient: ContainerClient
    private readonly shardingStrategy: ShardingStrategy

    constructor (containerClient: ContainerClient, init?: AzureBlockstoreInit) {
        super()

        if (containerClient == null) {
            throw new Error('An Azure container client must be supplied. See the blockstore-azure README for examples.')
        }
        
        this.azureClient = containerClient
        this.createIfMissing = init?.createIfMissing ?? false
        this.shardingStrategy = init?.shardingStrategy ?? new NextToLast()

        // Create the container if it doesn't exist
        this.azureClient.createIfNotExists();
    }

    /**
     * Store the given value under the key.
     */
    async put (key: CID, val: Uint8Array, options?: AbortOptions): Promise<CID> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key));
            await blobClient.uploadData(val, { metadata: { key: this.shardingStrategy.encode(key) }, 
            abortSignal: options?.signal });
            return key;
        } catch (err: any) {
            throw Errors.putFailedError(err)
        }
    }

    /**
     * Read from Azure
     */
    async get (key: CID, options?: AbortOptions): Promise<Uint8Array> {
        try {

            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key));
            // downloading the blob
            const response = await blobClient.download(0, undefined, { 
                abortSignal: options?.signal });

            if (!response.readableStreamBody) {
                throw new Error("Readable stream is not available.");
            }

            // reading the stream as uint8 array and returning it
            return this.readStreamAsUint8Array(response.readableStreamBody);

        } catch (err: any) {
            if (err.statusCode === 404) {
                throw Errors.notFoundError(err);
            }
            throw err;
        }
    }

    /** 
     * Private method for reading the stream into a uint array
    **/
    private async readStreamAsUint8Array(stream: NodeJS.ReadableStream): Promise<Uint8Array> {
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            if (typeof chunk === 'string' || chunk instanceof Buffer) {
                // Convert string or Buffer chunks to Uint8Array
                chunks.push(new Uint8Array(Buffer.from(chunk)));
            } else {
                // Assume it's already Uint8Array
                chunks.push(chunk);
            }
        }
        return Buffer.concat(chunks);
    }

    /**
     * Check for the existence of the given key
     */
    async has (key: CID, options?: AbortOptions): Promise<boolean> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key));
            // Check if the blob exist
            const blobExists = blobClient.exists({ abortSignal: options?.signal });            

            // If the blob exists, return true; otherwise, return false;
            return blobExists;
            
        } catch (err: any) {
            // doesn't exist and permission policy includes list container
            if (err.$metadata?.httpStatusCode === 404) {
                return false
            }

            // doesn't exist, permission policy does not include list container
            if (err.$metadata?.httpStatusCode === 403) {
                return false
            }

            throw err
        }
    }

    /**
     * Delete the record under the given key
     */
    async delete (key: CID, options?: AbortOptions): Promise<void> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key));

            // Delete the blob
            await blobClient.delete({ abortSignal: options?.signal });

        } catch (err: any) {
            throw Errors.deleteFailedError(err)
        }
    }

    async * getAll (options?: AbortOptions): AsyncIterable<Pair> {
        try {
            while (true){ 
            // Use the `listBlobsFlat` method to list all blobs in the container
            const blobItems = this.azureClient.listBlobsFlat({ abortSignal: options?.signal });

            // Iterate over the blobs and print the name and length of each
            for await (const blobItem of blobItems) {
                const cid = this.shardingStrategy.decode(blobItem.name);

                // Convert blobItem to a Pair or your desired data structure
                yield{
                    cid,
                    block: await this.get(cid, options)
                }
            }
            break;
        }
        } catch (err: any) {
            throw new Error(err.code)
        }
    }

    /**
     * This will check the Azure blob storage container to ensure access and existence
     */
    async open (options?: AbortOptions): Promise<void> {
        try {
            // Use the `getProperties` method to check if the container exists
            await this.azureClient.getProperties({ abortSignal: options?.signal });

        } catch (err: any) {
            if (err.statusCode !== 404) {
                if (this.createIfMissing) {
                    // Optionally, create the container if it doesn't exist
                    await this.azureClient.create({ abortSignal: options?.signal });
                }
                else {
                    // If not set to create, throw an error
                    throw Errors.openFailedError(err);
                }
            }
            else {
                // The container does not exist, and createIfMissing is true
                if (this.createIfMissing) {
                    await this.azureClient.create({ abortSignal: options?.signal });
                } else {
                    throw Errors.openFailedError(err);
                }
            }
        }
    }
}