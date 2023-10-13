import { BaseBlockstore } from "blockstore-core/base"
import * as Errors from 'blockstore-core/errors'
import { NextToLast, type ShardingStrategy } from "./sharding.js"
import type { AbortOptions } from "interface-store"
import { BlockBlobClient } from "@azure/storage-blob"
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
            // 
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
            // add azure implementation
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
            // add azure implementation
        } catch (err: any) {
            throw Errors.deleteFailedError(err)
        }
    }

    async * getAll (options?: AbortOptions): AsyncIterable<Pair> {
        const params: Record<string, any> = {}

        try {
            while (true) {
                // add azure implementation
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
            // add azure implementation
        } catch (err: any) {
            if (err.statusCode !== 404) {
                if (this.createIfMissing) {
                    // add azure implementation
                }
                throw Errors.openFailedError(err)
            }
        }
    }
}