import fs from "fs";
import path from "path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Local disk by default (matches how this app has always run). Once
 * S3_BUCKET/S3_ACCESS_KEY_ID/etc are set (e.g. Cloudflare R2 or AWS S3), files
 * go there instead — required for most cloud hosts, whose local disk is wiped
 * on every deploy/restart.
 */
const useS3 = !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
if (!useS3) fs.mkdirSync(uploadDir, { recursive: true });

const s3 = useS3
  ? new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT, // e.g. https://<account>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export function isRemoteStorage(): boolean {
  return useS3;
}

/** Returns the storage_url to persist in the DB — a public URL for S3, or a /uploads/<file> path served by Express locally. */
export async function saveUploadedFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  if (useS3 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const publicBase = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`;
    return `${publicBase.replace(/\/$/, "")}/${filename}`;
  }

  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function deleteUploadedFile(storageUrl: string): Promise<void> {
  if (useS3 && s3) {
    const filename = storageUrl.split("/").pop()!;
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: filename })).catch(() => {});
    return;
  }
  const filePath = path.join(uploadDir, path.basename(storageUrl));
  fs.unlink(filePath, () => {});
}

export function generateFilename(originalName: string, prefix = ""): string {
  const ext = path.extname(originalName) || ".jpg";
  return `${prefix}${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}
