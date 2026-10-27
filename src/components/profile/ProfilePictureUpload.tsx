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
        setSuccess("Profile picture updated successfully.");
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
      setSuccess("Profile picture removed.");
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
        <div className="alert alert-warning text-xs py-2 px-3 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-warning" />
          <span>Profile picture editing has been locked by an administrator.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative group shrink-0">
          <UserAvatar
            src={currentImage}
            name={displayName}
            size="xl"
            modalTitle={`${displayName} - Profile Picture`}
          />
          {uploading && (
            <div className="absolute inset-0 bg-base-900/60 rounded-full flex flex-col items-center justify-center text-white p-1 text-center">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-2xs font-bold mt-1">
                {optimizing ? "Optimizing..." : `${progress}%`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3 className="text-sm font-bold text-base-content">Profile Photo</h3>
            <p className="text-xs text-base-content/60">
              Upload a PNG, JPG, or WebP photo up to 2MB.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
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
              className="btn btn-primary btn-sm text-xs gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              {currentImage ? "Change photo" : "Upload photo"}
            </button>

            {currentImage && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={locked || uploading || removing}
                className="btn btn-outline btn-error btn-sm text-xs gap-1.5 cursor-pointer"
              >
                {removing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
