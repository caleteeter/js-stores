import sinon from "sinon";
import {
  BlobClient,
  ContainerClient,
  BlobServiceClient,
} from "@azure/storage-blob";

export function mockAzureBlobStorage() {
  const blobClientMock = sinon.createStubInstance(BlobClient);
  const containerClientMock = sinon.createStubInstance(ContainerClient);
  const blobServiceClientMock = sinon.createStubInstance(BlobServiceClient);

  blobServiceClientMock.getContainerClient.returns(containerClientMock as any);
  containerClientMock.getBlockBlobClient.returns(blobClientMock as any);

  return { blobServiceClientMock, containerClientMock, blobClientMock };
}
