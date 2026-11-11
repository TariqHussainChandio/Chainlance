import "server-only";

import { v2 as cloudinary } from "cloudinary";

const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

if (!apiKey || !apiSecret || !cloudName) {
  // Server-only warning — Cloudinary calls that need these will throw at
  // call site. Surfacing here makes "I forgot the .env" obvious in logs.
  console.warn(
    "[cloudinary] Missing env: " +
      [
        !cloudName && "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
        !apiKey && "CLOUDINARY_API_KEY",
        !apiSecret && "CLOUDINARY_API_SECRET",
      ]
        .filter(Boolean)
        .join(", ") +
      ". Server-side Cloudinary operations (e.g. deletes) will fail."
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };
