import { expect } from "chai";
import { mockAzureBlobStorage } from "./utils/azure-mock"; // Import the mock setup
import { AzureBlockstore } from "../src/index"; // Update this import
import { Datastore } from "../../interface-datastore/src/index";
import { CID } from "multiformats/cid";
import { Key } from "../../interface-blockstore/src/index";
import all from "../../interface-blockstore-tests/src/index"; // if you're using interface-datastore-tests

describe("AzureBlockstore", () => {
  let blockstore: AzureBlockstore;
  let blobServiceClientMock: any;
  let containerClientMock: any;
  let blobClientMock: any;
  let cid: CID;
  let data: Uint8Array;

  before(() => {
    cid = CID.parse("someCID"); // Replace this with an actual CID instance if needed
    data = new Uint8Array([1, 2, 3]);
  });

  beforeEach(() => {
    // Use the mock setup
    ({ blobServiceClientMock, containerClientMock, blobClientMock } =
      mockAzureBlobStorage());

    blockstore = new AzureBlockstore(blobServiceClientMock, "testContainer");
  });

  it("should implement the Datastore interface", () => {
    expect(Datastore.isDatastore(blockstore)).to.be.true;
  });

  it("should store and retrieve a block", async () => {
    blobClientMock.uploadData.resolves({ _response: { status: 201 } });

    await blockstore.put(new Key(cid.toString()), data);

    blobClientMock.download.resolves({
      readableStreamBody: {
        [Symbol.asyncIterator]: async function* () {
          yield data;
        },
      },
    });

    const retrievedData = await blockstore.get(new Key(cid.toString()));
    expect(retrievedData).to.deep.equal(data);
  });

  // Add more tests for other methods and edge cases
});

// Test for interface-datastore compliance
all(blockstore);
