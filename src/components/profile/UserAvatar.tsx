"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  anonymousId?: string | null;
  role?: "LEARNER" | "TUTOR" | "ADMIN" | null;
  size?: AvatarSize;
  className?: string;
  clickable?: boolean;
  modalTitle?: string;
  subtitle?: string | null;
  priority?: boolean;
}

const SIZE_CLASSES: Record<AvatarSize, { px: number; container: string; text: string }> = {
  xs: { px: 24, container: "w-6 h-6", text: "text-3xs" },
  sm: { px: 32, container: "w-8 h-8", text: "text-2xs" },
  md: { px: 40, container: "w-10 h-10", text: "text-xs" },
  lg: { px: 56, container: "w-14 h-14", text: "text-base" },
  xl: { px: 80, container: "w-20 h-20", text: "text-xl" },
  "2xl": { px: 112, container: "w-28 h-28", text: "text-3xl" },
};

export default function UserAvatar({
  src,
  name,
  anonymousId,
  role,
  size = "md",
  className = "",
  clickable = true,
  modalTitle,
  subtitle,
  priority = false,
}: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [modalHasError, setModalHasError] = useState(false);

  const displayName = name || anonymousId || "User";
  const initials = displayName
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "U";

  const sizeStyle = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const isImageValid = Boolean(src && !hasError);
  const isZoomable = Boolean(clickable && isImageValid);

  const title = modalTitle ?? `${displayName}'s Profile Picture`;

  return (
    <>
      <div
        className={`inline-block shrink-0 ${isZoomable ? "cursor-pointer group" : ""}`}
        onClick={
          isZoomable
            ? (e) => {
                e.stopPropagation();
                setIsOpen(true);
              }
            : undefined
        }
        onKeyDown={
          isZoomable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(true);
                }
              }
            : undefined
        }
        role={isZoomable ? "button" : undefined}
        tabIndex={isZoomable ? 0 : undefined}
        aria-label={isZoomable ? `View larger profile picture of ${displayName}` : undefined}
        title={isZoomable ? "Click to view larger picture" : undefined}
      >
        <div
          className={`${sizeStyle.container} rounded-full overflow-hidden border border-primary/20 bg-base-300 flex items-center justify-center font-bold text-primary shadow-2xs transition-all ${
            isZoomable
              ? "group-hover:ring-2 group-hover:ring-primary group-hover:scale-105 active:scale-95"
              : ""
          } ${className}`}
        >
          {isImageValid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src!}
              alt={displayName}
              width={sizeStyle.px}
              height={sizeStyle.px}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover"
              onError={() => setHasError(true)}
            />
          ) : (
            <span className={sizeStyle.text}>{initials}</span>
          )}
        </div>
      </div>

      {isZoomable && isOpen && (
        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          title={title}
          size="md"
        >
          <div className="flex flex-col items-center justify-center p-1 sm:p-2">
            <div className="relative w-full max-w-sm sm:max-w-md max-h-[70vh] rounded-2xl overflow-hidden border border-base-300 bg-base-300 shadow-xl flex items-center justify-center min-h-[160px]">
              {!modalHasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src!}
                  alt={displayName}
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto max-h-[65vh] object-contain rounded-2xl"
                  onError={() => setModalHasError(true)}
                />
              ) : (
                <div className="p-8 text-center text-xs text-base-content/60">
                  Failed to load full-size image.
                </div>
              )}
            </div>
            {(anonymousId || subtitle || role) && (
              <div className="mt-4 text-center space-y-0.5">
                {name && anonymousId && name !== anonymousId && (
                  <p className="text-xs font-mono font-medium text-base-content/80">
                    {anonymousId}
                  </p>
                )}
                {subtitle && (
                  <p className="text-2xs text-base-content/60">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
