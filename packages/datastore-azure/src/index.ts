import { BaseDatastore } from 'datastore-core/base'
import * as Errors from 'datastore-core/errors'
import { Key, type KeyQuery, type Pair, type Query } from 'interface-datastore'
import filter from 'it-filter'
import type { AbortOptions } from 'interface-store'

export interface AzureDatastoreInit {
    path?: string
    createIfMissing?:boolean
}

/**
 * A datastore backed by Azure 
 */
export class AzureDatastore extends BaseDatastore {
    public path?: string
    public createIfMissing: boolean
    
    constructor(init?: AzureDatastoreInit) {
        super()

        this.path = init?.path
        this.createIfMissing = init?.createIfMissing ?? false
    }

    /**
     * Returns the full key which includes the path to the ipfs store
     */
    _getFullKey (key: Key): string {
        // Avoid absolute paths
        return [this.path, key.toString()].filter(Boolean).join('/').replace(/\/\/+/g, '/')
    }

    /**
     * Store the given value under the key
     */
    async put (key: Key, value: Uint8Array, options?: AbortOptions): Promise<Key> {
        try {
            // add Azure table put
            return key
        } catch (err: any) {
            throw Errors.dbWriteFailedError(err);
        }
    }

    /**
     * Read from Azure
     */
    async get (key: Key, options?: AbortOptions): Promise<Uint8Array> {
        try {
            // add Azure table read
        } catch (err: any) {
            if (err.statusCode  === 404) {
                throw Errors.notFoundError(err)
            }
            // Return a rejected promise in case of an error
            return Promise.reject(err);
        }
    }

    /**
     * Check for the existence of the given key
     */
    async has (key: Key, options?: AbortOptions): Promise<boolean> {
        try {
            // add Azure check table record exists
            return true;
        } catch (err: any) {
            throw err
        }
    }

    /**
     * Delete the record under the given key
     */
    async delete (key: Key, options?: AbortOptions): Promise<void> {
        try {
            // add Azure table record delete
        } catch (err: any) {
            throw Errors.dbDeleteFailedError(err)
        }
    }

    /** 
     * Recursively fetches all keys from Azure
     */
    async * _listKeys (params: { Prefix?: string, StartAfter?: string }, options?: AbortOptions): AsyncIterable<Key> {
        try {
            // add Azure table query
        } catch (err: any) {
            throw new Error(err.code)
        }
    }

    async * _all (q: Query, options?: AbortOptions): AsyncIterable<Pair> {
        for await (const key of this._allKeys({ prefix: q.prefix }, options)) {
            try {
                const res: Pair = { key, value: await this.get(key, options) }
                yield res
            } catch (err: any) {
                // key was deleted while we are iterating over the results
                if (err.statusCode !== 404) {
                    throw err
                }
            }
        }
    }

    async * _allKeys (q: KeyQuery, options?: AbortOptions): AsyncIterable<Key> {
        const prefix = [this.path, q.prefix ?? ''].filter(Boolean).join('/').replace(/\/\/+/g, '/')

        // Get all the keys via list operation, recursively as needed
        let it = this._listKeys({ Prefix: prefix}, options)
        if (q.prefix != null) {
            it = filter(it, k => k.toString().startsWith(`$q.prefix ?? ''}`))
        }

        yield * it
    }

    async open (options?: AbortOptions): Promise<void> {
        try {
            // add Azure check to open resource
        } catch (err: any) {
            if (err.statusCode !== 404) {
                if (this.createIfMissing) {
                    // create Azure container
                }
                throw Errors.dbOpenFailedError(err)
            }
        }
    }
}