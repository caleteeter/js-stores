import { BaseBlockstore } from "blockstore-core/base"
import * as Errors from 'blockstore-core/errors'
import { NextToLast, type ShardingStrategy } from "./sharding.js"
import type { AbortOptions } from "interface-store"
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"
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

    constructor (azureClient: BlobServiceClient, container: string, init?: AzureBlockstoreInit) {
        super()

        if (azureClient == null) {
            throw new Error('An Azure blob client must be supplied. See the blockstore-azure README for examples.')
        }

        if (container == null) {
            throw new Error('A container must be supplied. See the blockstore-azure README for examples.')
        }

        this.azureClient = azureClient.getContainerClient(container)
        this.createIfMissing = init?.createIfMissing ?? false
        this.shardingStrategy = init?.shardingStrategy ?? new NextToLast()

        // create container if not existing
        this.azureClient.createIfNotExists();
    }

    /**
     * Store the given value under the key.
     */
    async put (key: CID, val: Uint8Array, options?: AbortOptions): Promise<CID> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key))
            await blobClient.uploadData(val)
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
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key))
            const dlBuffer = await blobClient.downloadToBuffer(0, undefined)
            return new Uint8Array(dlBuffer.buffer);
        } catch (err: any) {
            if (err.statusCode === 404) {
                throw Errors.notFoundError(err)
            }
            throw err
        }
    }

    /**
     * Check for the existence of the given key
     */
    async has (key: CID, options?: AbortOptions): Promise<boolean> {
        try {
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key))
            return await blobClient.exists();
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
            const blobClient = this.azureClient.getBlockBlobClient(this.shardingStrategy.encode(key))
            await blobClient.deleteIfExists({ deleteSnapshots: 'include'});
        } catch (err: any) {
            throw Errors.deleteFailedError(err)
        }
    }

    /*
    async * getAll (options?: AbortOptions): AsyncIterable<Pair> {
        try {
            while (true) {
                const iterator = this.azureClient.listBlobsFlat()
                for await (const item of iterator) {
                    const cid = this.shardingStrategy.decode(item.name)
                    yield {
                        cid,
                        block: await this.get(cid, options)
                    }
                }
                break
            }
        } catch (err: any) {
            throw new Error(err.code)
        }
    }
    */
}