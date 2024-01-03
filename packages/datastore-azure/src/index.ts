import { BaseDatastore } from "datastore-core/base"
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"
import { Key, type KeyQuery, type Pair, type Query } from "interface-datastore"
import type { AbortOptions } from "interface-store"
import * as Errors from 'datastore-core/errors'

export interface AzureDatastoreInit {
    /**
     * An optional path to append to all files in the storage container
     */
    path?: string

    /**
     * Whether to try to create the storage container if not found
     */
    createIfMissing?: boolean
}

/**
 * A datastore backed by Azure storage
 */
export class AzureDatastore extends BaseDatastore {
    private readonly azureClient: ContainerClient
    public createIfMissing: boolean
    private path?: string

    constructor(azureClient: BlobServiceClient, container: string, init?: AzureDatastoreInit) {
        super()

        if (azureClient == null) {
            throw new Error('An Azure blob client must be supplied.')
        }

        if (container == null) {
            throw new Error('A container must be supplied.')
        }

        this.path = init?.path
        this.azureClient = azureClient.getContainerClient(container)
        this.createIfMissing = init?.createIfMissing ?? false

        // create the container if it does not exist
        if (this.createIfMissing) {
            this.azureClient.createIfNotExists()
        }
    }

    /**
     * Returns the full key which includes the path to the ipfs store
     */
    _getFullKey(key: Key): string {
        return [this.path, key.toString()].filter(Boolean).join('/').replace(/\/\/+/g, '/')
    }

    /**
     * Store the given value under the key.
     */
    async put(key: Key, val: Uint8Array, options?: AbortOptions): Promise<Key> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this._getFullKey(key))
            await blobClient.uploadData(val)
            return key
        } catch (err: any) {
            throw Errors.dbWriteFailedError(err)
        }
    }

    /**
     * Read from Azure
     */
    async get (key: Key, options?: AbortOptions): Promise<Uint8Array> {
        try {

            const blobClient = this.azureClient.getBlockBlobClient(this._getFullKey(key));
            // downloading the blob
            const response = await blobClient.download(0, undefined, { 
                abortSignal: options?.signal });

            if (!response.readableStreamBody) {
                throw new Error("Readable stream is not available.");
            }

            // reading the stream as uint8 array and returning it
            return await this.readStreamAsUint8Array(response.readableStreamBody);

        } catch (err: any) {
            if (err.statusCode === 404) {
                throw Errors.notFoundError(err);
            }
            throw err
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
    async has (key: Key, options?: AbortOptions): Promise<boolean> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this._getFullKey(key))
            // Check if the blob exist
            const blobExists = blobClient.exists({ abortSignal: options?.signal })         

            // If the blob exists, return true; otherwise, return false;
            return blobExists
            
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
    async delete (key: Key, options?: AbortOptions): Promise<void> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this._getFullKey(key))

            // Delete the blob
            await blobClient.delete({ abortSignal: options?.signal })

        } catch (err: any) {
            throw Errors.dbDeleteFailedError(err)
        }
    }

    /**
     * 
     * Recursively fetches all keys from Azure 
     */
    async * _listKeys(params: { Prefix?: string, StartAfter?: string }, options?: AbortOptions): AsyncIterable<Key> {
        try {
            const blobs = this.azureClient.listBlobsFlat()

            if (options?.signal?.aborted === true) {
                return
            }

            for await (const blob of blobs) {
                yield new Key(blob.name)
            }
        } catch (err: any) {
            throw new Error(err.code)
        }
    }

    async * _all(q: Query, options?: AbortOptions): AsyncIterable<Pair> {
        for await (const key of this._allKeys({ prefix: q.prefix }, options)) {
            try {
                const res: Pair = {
                    key,
                    value: await this.get(key, options)
                }
                yield res
            } catch (err: any) {
                if (err.statusCode !== 404) {
                    throw err
                }
            }
        }
    } 

    async * _allKeys (q: KeyQuery, options?: AbortOptions): AsyncIterable<Key> {
        const prefix = [this.path, q.prefix ?? ''].filter(Boolean).join('/').replace(/\/\/+/g, '/')

        // get all the keys via the list
        let it = this._listKeys({ Prefix: prefix }, options)

        /*
        console.log(`List keys result: ${JSON.stringify(it)}`)

        if (q.prefix != null) {
            it = filter(it, k => k.toString().startsWith(`${q.prefix ?? ''}`))
        }
        */

        yield * it
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
                    throw Errors.dbOpenFailedError(err);
                }
            }
            else {
                // The container does not exist, and createIfMissing is true
                if (this.createIfMissing) {
                    await this.azureClient.create({ abortSignal: options?.signal });
                } else {
                    throw Errors.dbOpenFailedError(err);
                }
            }
        }
    }
}