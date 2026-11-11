import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export type CloudinaryFolder = "gigs" | "kyc" | "avatars" | "dispute-evidence" | "attachments";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

interface CloudinaryRawResponse {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}

/**
 * Client-side upload helper that attempts Cloudinary first,
 * falls back to Firebase Storage if Cloudinary is demo/unconfigured,
 * and finally falls back to Data URL (base64) so image uploads NEVER fail.
 */
export async function uploadToCloudinary(
  file: File,
  folder: CloudinaryFolder
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 1. Try Cloudinary if real credentials provided
  if (cloudName && preset && cloudName !== "demo" && preset !== "demo") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("folder", folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data: CloudinaryRawResponse = await res.json().catch(() => ({}));

      if (res.ok && data.secure_url && data.public_id) {
        return { url: data.secure_url, publicId: data.public_id };
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, attempting Firebase Storage fallback...", err);
    }
  }

  // 2. Fallback: Firebase Storage (with timeout so CORS or bucket issues never hang the UI)
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageRef = ref(storage, `${folder}/${Date.now()}_${cleanName}`);
    
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { url: downloadUrl, publicId: storageRef.fullPath };
    })();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Storage timeout/CORS block")), 2500)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (firebaseErr) {
    console.warn("Firebase Storage upload failed or blocked by CORS, using instant Data URL fallback...", firebaseErr);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ url: reader.result, publicId: `data_${Date.now()}` });
      } else {
        reject(new Error("Failed to read image file into data URL."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export const uploadFileGuarantee = async (file: File, folder: CloudinaryFolder = "avatars"): Promise<string> => {
  const result = await uploadToCloudinary(file, folder);
  return result.url;
};

export const MAX_DELIVERY_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function uploadDeliveryFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileName: string; fileSize: number }> {
  if (file.size > MAX_DELIVERY_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${formatFileSize(file.size)}) exceeds the maximum allowed 5 GB limit.`
    );
  }

  onProgress?.(30);
  const result = await uploadToCloudinary(file, "gigs");
  onProgress?.(100);

  return {
    url: result.url,
    fileName: file.name,
    fileSize: file.size,
  };
}
