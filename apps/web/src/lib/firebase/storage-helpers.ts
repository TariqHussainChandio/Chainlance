// Firebase Storage is no longer used — all media moves through Cloudinary
// (see src/lib/cloudinary/). This file keeps a stub of deleteFileFromUrl
// because deleteGig still imports it for cleanup of legacy Firebase URLs.
// New uploads return Cloudinary URLs and never call this. Orphan Cloudinary
// asset cleanup on gig delete will be wired in a follow-up by storing
// publicId alongside thumbnailUrl on the gig doc.

export async function deleteFileFromUrl(url: string): Promise<void> {
  console.warn(
    "[deleteFileFromUrl] Storage not configured. Skipping delete for " + url
  );
}
