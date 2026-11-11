import "server-only";

import { cloudinary } from "@/lib/cloudinary/config";

/**
 * Best-effort delete. Cloudinary returns `{ result: "ok" }` on success or
 * `{ result: "not found" }` if the asset is already gone; both are fine.
 * Network or auth failures get swallowed with a warn so caller flows
 * (e.g. gig deletion) don't fail just because the asset cleanup didn't.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.warn(
      `[deleteCloudinaryAsset] Failed to delete ${publicId}:`,
      err
    );
  }
}
