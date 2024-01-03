/* eslint-env mocha */

import { JSDOM } from 'jsdom'
import { BlobServiceClient } from "@azure/storage-blob"
import { expect } from 'aegir/chai'
import { AzureDatastore } from '../src/index.js'

describe('AzureDatastore', () => {
    describe('construction', () => {
        before(() => {
            const { window } = new JSDOM()

            if (!globalThis.document) {
                globalThis.document = window.document
              }
              
              if (!globalThis.DOMParser) {
                globalThis.DOMParser = window.DOMParser
              }
              
              if (!globalThis.XMLSerializer) {
                globalThis.XMLSerializer = window.XMLSerializer
              }
              
              if (!globalThis.Node) {
                globalThis.Node = window.Node
              }
        })
        it('requires an Azure client', () => {
            expect(
                // @ts-expect-error missing params
                () => new AzureDatastore() 
            ).to.throw()
        })

        it('requires a container', () => {
            const azure = new BlobServiceClient('test')
            expect(
                // @ts-expect-error missing params
                () => new AzureDatastore(azure)
            ).to.throw()
        })

        /*
        it('createIfMissing defaults to false', () => {
            const azure = new BlobServiceClient('test')
            const store = new AzureDatastore(azure, 'test')
            expect(store.createIfMissing).to.equal(true)
        })
        */
    })
})