import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { env } from "../env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export function isR2Configured(): boolean {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

export async function uploadToR2(buffer: Buffer, contentType: string, folder = "products"): Promise<{ key: string; url: string }> {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 não está configurado (defina as variáveis R2_* no .env)");
  }

  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `${folder}/${randomUUID()}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return { key, url };
}

export async function deleteFromR2(key: string): Promise<void> {
  if (!isR2Configured()) return;
  await r2Client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}
