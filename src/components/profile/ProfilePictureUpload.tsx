"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Camera, Trash2, Lock, Loader2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import UserAvatar from "@/components/profile/UserAvatar";
import { useUploadThing } from "@/lib/uploadthing";
import { validateAndOptimizeImage } from "@/lib/images/clientImageOptimizer";
import { IMAGE_CONFIG } from "@/lib/images/imageConfig";

interface ProfilePictureUploadProps {
  initialImage?: string | null;
  locked?: boolean;
  name?: string;
  onImageUpdated?: (newUrl: string | null) => void;
}

export default function ProfilePictureUpload({
  initialImage,
  locked = false,
  name,
  onImageUpdated,
}: ProfilePictureUploadProps) {
  const { data: session, update: updateSession } = useSession();
  const [currentImage, setCurrentImage] = useState<string | null>(
    initialImage ?? session?.user?.image ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = name ?? session?.user?.fullName ?? session?.user?.anonymousId ?? "User";

  const { startUpload } = useUploadThing("profilePicture", {
    onUploadProgress: (p) => {
      setProgress(p);
    },
    onClientUploadComplete: async (res) => {
      setUploading(false);
      setOptimizing(false);
      setProgress(0);
      if (res && res[0]) {
        const fileUrl = res[0].ufsUrl ?? res[0].url;
        setCurrentImage(fileUrl);
        setSuccess("Photo updated.");
        onImageUpdated?.(fileUrl);
        try {
          await updateSession();
        } catch {
          /* non-fatal if session re-fetch is delayed */
        }
        setTimeout(() => setSuccess(""), 4000);
      }
    },
    onUploadError: (err) => {
      setUploading(false);
      setOptimizing(false);
      setProgress(0);
      setError(err.message || "Failed to upload profile picture.");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > IMAGE_CONFIG.MAX_UPLOAD_BYTES) {
      setError(`Image size must be less than ${Math.round(IMAGE_CONFIG.MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError("");
    setSuccess("");
    setOptimizing(true);
    setUploading(true);

    try {
      // Automatic client-side optimization: magic byte check, decompression bomb guard,
      // aspect-preserving resize to max 512px, EXIF/GPS stripping, and WebP compression.
      const result = await validateAndOptimizeImage(file);
      setOptimizing(false);

      await startUpload([result.file]);
    } catch (err) {
      setOptimizing(false);
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!currentImage || locked) return;
    setRemoving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile-picture", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove profile picture.");

      setCurrentImage(null);
      setSuccess("Photo removed.");
      onImageUpdated?.(null);
      try {
        await updateSession();
      } catch {
        /* non-fatal */
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove profile picture.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      {locked && (
        <p className="flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
          An administrator has locked your photo, so it can&apos;t be changed for now.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <div className="relative shrink-0">
          <UserAvatar
            src={currentImage}
            name={displayName}
            size="xl"
            modalTitle={`${displayName} - Profile Picture`}
          />
          {uploading && (
            <div className="absolute inset-0 bg-neutral/70 rounded-full flex flex-col items-center justify-center text-neutral-content p-1 text-center">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-semibold mt-1">
                {optimizing ? "Preparing…" : `${progress}%`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={locked || uploading || removing}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={locked || uploading || removing}
            className="btn btn-outline gap-2"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            {currentImage ? "Change photo" : "Upload photo"}
          </button>

          {currentImage && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={locked || uploading || removing}
              className="btn btn-ghost text-error gap-2"
            >
              {removing ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              )}
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
