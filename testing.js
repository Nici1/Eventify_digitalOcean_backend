
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';


const blobServiceClient = new BlobServiceClient(`https://lord.blob.core.windows.net/test?sp=racwdli&st=2024-02-05T10:16:09Z&se=2024-05-04T17:16:09Z&sv=2022-11-02&sr=c&sig=0TU4TsK2ZKD03RMpluNeGZQjWpuDqZKAqGUfdN5fJNM%3D`);

const containerName = "test";

async function main() {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const content = "Hello world!";
  const blobName = "newblob" + new Date().getTime();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
  console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
}

main();