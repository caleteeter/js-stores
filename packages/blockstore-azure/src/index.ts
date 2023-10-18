import { BaseBlockstore } from "blockstore-core/base"
import * as Errors from 'blockstore-core/errors'
import { NextToLast, type ShardingStrategy } from "./sharding.js"
import type { AbortOptions } from "interface-store"
import { BlockBlobClient } from "@azure/storage-blob"
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
    private readonly azureClient: BlockBlobClient
    private readonly container: string
    private readonly shardingStrategy: ShardingStrategy

    constructor (azureClient: BlockBlobClient, container: string, init?: AzureBlockstoreInit) {
        super()

        if (azureClient == null) {
            throw new Error('An Azure blob client must be supplied. See the blockstore-azure README for examples.')
        }

        if (container == null) {
            throw new Error('A container must be supplied. See the blockstore-azure README for examples.')
        }

        this.azureClient = azureClient
        this.container = container
        this.createIfMissing = init?.createIfMissing ?? false
        this.shardingStrategy = init?.shardingStrategy ?? new NextToLast()
    }

    /**
     * Store the given value under the key.
     */
    async put (key: CID, val: Uint8Array, options?: AbortOptions): Promise<CID> {
        try {
            await this.azureClient.uploadData(val, { metadata: { key: this.shardingStrategy.encode(key) }, abortSignal: options?.signal });
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
            // getting blob name from the azure client
            const blobName = await this.azureClient.getBlobName(key, { abortSignal: options?.signal });

            // getting blob client from the azure client
            const blobClient = await this.azureClient.getBlockBlobClient(blobName, { abortSignal: options?.signal });

            // downloading the blob
            const response = await blobClient.download(0, undefined, { abortSignal: options?.signal });

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
            // Getting blob name from the azure client
            const blobName = await this.azureClient.getBlobName(key, { abortSignal: options?.signal });

            // Getting blob client from the azure client
            const blobClient = this.azureClient.getBlockBlobClient(blobName, { abortSignal: options?.signal });

            // Check if the blob exists
            const blobProperties = await blobClient.getProperties({ abortSignal: options?.signal });

            // If the blob exists, return true; otherwise, return false;
            return blobProperties === null ? false : true;
            
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
            // Getting blob name from the azure client
            const blobName = await this.azureClient.getBlobName(key, { abortSignal: options?.signal });

            // Getting blob client from the azure client
            const blobClient = this.azureClient.getBlockBlobClient(blobName, { abortSignal: options?.signal });

            // Delete the blob
            await blobClient.delete({ abortSignal: options?.signal });

        } catch (err: any) {
            throw Errors.deleteFailedError(err)
        }
    }

    async * getAll (options?: AbortOptions): AsyncIterable<Pair> {
        // TODO: ask about this params
        //const params: Record<string, any> = {}

        try {
            // Getting container client from the azure client
            const containerClient = this.azureClient.getContainerClient(this.container);

            // Use the `listBlobsFlat` method to list all blobs in the container
            const blobItems = containerClient.listBlobsFlat({ abortSignal: options?.signal });

            // Iterate over the blobs and print the name and length of each
            for await (const blobItem of blobItems) {
                // Convert blobItem to a Pair or your desired data structure
                const pair: Pair = {
                    key: blobItem.name, // Set the key to the blob name
                    value: blobItem.properties.contentLength // Set the value to the content length or other relevant information
                };

                yield pair;
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
            // Getting container client from the azure client
            const containerClient = this.azureClient.getContainerClient(this.container);

            // Use the `getProperties` method to check if the container exists
            await containerClient.getProperties({ abortSignal: options?.signal });

        } catch (err: any) {
            if (err.statusCode !== 404) {
                if (this.createIfMissing) {
                    // Optionally, create the container if it doesn't exist
                    await this.azureClient.getContainerClient(this.container).create({ abortSignal: options?.signal });
                }
                else {
                    // If not set to create, throw an error
                    throw Errors.openFailedError(err);
                }
            }
            else {
                // The container does not exist, and createIfMissing is true
                if (this.createIfMissing) {
                    await this.azureClient.getContainerClient(this.container).create({ abortSignal: options?.signal });
                } else {
                    throw Errors.openFailedError(err);
                }
            }
        }
    }
}