import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | undefined;

export function getObjectStorage() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Object storage is not configured");
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true
    });
  }
  return { client, bucket };
}
